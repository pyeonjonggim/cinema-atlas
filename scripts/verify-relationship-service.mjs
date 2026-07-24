import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { createPool, hasDatabaseUrl, repoRoot } from "./lib/postgres-pilot-utils.mjs";

const artifactRoot = path.join(repoRoot, "data", "imports", "relationship-service");
const servicePath = path.join(repoRoot, "lib", "relationships", "relationshipService.ts");
const registryPath = path.join(repoRoot, "lib", "relationships", "relationshipRegistry.ts");
const runtimeRoots = ["lib", "app", "components"];
const auditRoots = ["lib", "app", "components", "scripts"];
const sourceExtensions = new Set([".ts", ".tsx", ".mjs", ".js"]);
const serviceMethods = [
  "getRelatedEntities",
  "getOutgoingRelationships",
  "getIncomingRelationships",
  "getRelationshipSummary",
  "existsRelationship",
];
const repositoryMethods = ["findOutgoing", "findIncoming", "findBetween", "findByType", "findNeighbors"];
const serviceCoverage = {
  getRelatedEntities: ["findNeighbors"],
  getOutgoingRelationships: ["findOutgoing"],
  getIncomingRelationships: ["findIncoming"],
  getRelationshipSummary: ["findOutgoing", "findIncoming"],
  existsRelationship: ["findBetween"],
};

async function writeArtifact(fileName, payload) {
  await fs.mkdir(artifactRoot, { recursive: true });
  await fs.writeFile(path.join(artifactRoot, fileName), JSON.stringify(payload, null, 2));
}

async function rows(client, sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows;
}

async function walkFiles(root) {
  const absoluteRoot = path.join(repoRoot, root);
  const found = [];

  async function walk(current) {
    const entries = await fs.readdir(current, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
        await walk(fullPath);
        continue;
      }
      if (entry.isFile() && sourceExtensions.has(path.extname(entry.name))) {
        found.push(fullPath);
      }
    }
  }

  await walk(absoluteRoot);
  return found;
}

function currentFunctionName(lines, index) {
  for (let cursor = index; cursor >= 0; cursor -= 1) {
    const line = lines[cursor];
    const functionMatch = line.match(/(?:async\s+)?function\s+([A-Za-z0-9_]+)/);
    if (functionMatch) return functionMatch[1];
    const methodMatch = line.match(/^\s*(?:async\s+)?([A-Za-z0-9_]+)\s*\(/);
    if (methodMatch) return methodMatch[1];
  }
  return "module-scope";
}

async function loadRegistry() {
  const source = await fs.readFile(registryPath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const sandbox = {
    exports: {},
    require: () => ({}),
  };
  vm.runInNewContext(compiled, sandbox, { filename: registryPath });
  return sandbox.exports.relationshipRegistry;
}

async function auditComposition(relationshipTypes) {
  const files = (await Promise.all(auditRoots.map(walkFiles))).flat();
  const audits = [];

  for (const file of files) {
    const relative = path.relative(repoRoot, file).replace(/\\/g, "/");
    const content = await fs.readFile(file, "utf8").catch(() => "");
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      const methodsUsed = [...serviceMethods, ...repositoryMethods].filter((method) => line.includes(method));
      const legacyGraphCall = /getRelationsFrom|getRelationsTo|getRelationsFromSources|getEdgesByRelationType/.test(line);
      const directGraphSql = /FROM\s+knowledge_graph_edges|JOIN\s+knowledge_graph_edges|SELECT\s+.*knowledge_graph_edges/i.test(line);
      const graphWrite = /INSERT\s+INTO\s+knowledge_graph_edges|DELETE\s+FROM\s+knowledge_graph_edges|ON CONFLICT/i.test(line);
      const relationshipTypesUsed = relationshipTypes.filter((type) => line.includes(type));

      if (methodsUsed.length === 0 && !legacyGraphCall && !directGraphSql) return;

      const isService = relative === "lib/relationships/relationshipService.ts";
      const isRepository = relative === "lib/relationships/relationshipRepository.ts";
      const isPersistenceCompatibility =
        relative === "lib/catalogPersistence.ts" ||
        relative === "lib/postgresCatalogRepository.ts" ||
        relative === "lib/editorial/postgresEditorialRepository.ts";
      const isVerificationScript = relative.startsWith("scripts/");
      const duplicatedComposition =
        runtimeRoots.some((root) => relative.startsWith(`${root}/`)) &&
        !isService &&
        !isRepository &&
        !isPersistenceCompatibility &&
        !graphWrite &&
        (repositoryMethods.some((method) => line.includes(method)) || legacyGraphCall || directGraphSql);

      audits.push({
        file: relative,
        function: currentFunctionName(lines, index),
        line: index + 1,
        repositoryMethodsUsed: methodsUsed.filter((method) => repositoryMethods.includes(method)),
        serviceMethodsUsed: methodsUsed.filter((method) => serviceMethods.includes(method)),
        relationshipTypesUsed,
        duplicatedComposition,
        migrationRecommendation: isService
          ? "Canonical relationship composition service."
          : isRepository
            ? "Canonical repository dependency; allowed below the service layer."
            : isPersistenceCompatibility
              ? "Legacy repository compatibility or in-memory graph helper; not app-level composition."
              : isVerificationScript
                ? "Verification or audit code; not runtime application composition."
                : duplicatedComposition
                  ? "Migrate this graph composition to RelationshipService."
                  : "Uses RelationshipService or non-runtime graph reference.",
      });
    });
  }

  return audits;
}

function duplicatedComposition(audit) {
  return audit.filter((item) => item.duplicatedComposition);
}

function serviceMethodCoverage(serviceSource) {
  return serviceMethods.map((method) => ({
    serviceMethod: method,
    implemented: new RegExp(`async\\s+${method}\\s*\\(`).test(serviceSource),
    repositoryMethods: serviceCoverage[method],
    repositoryCallsPresent: serviceCoverage[method].every((repositoryMethod) =>
      serviceSource.includes(`.${repositoryMethod}(`),
    ),
  }));
}

async function main() {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is required for verify:relationship-service.");
  }

  const [serviceSource, registry] = await Promise.all([
    fs.readFile(servicePath, "utf8"),
    loadRegistry(),
  ]);
  const relationshipTypes = registry.map((definition) => definition.key);
  const compositionAudit = await auditComposition(relationshipTypes);
  const duplicates = duplicatedComposition(compositionAudit);
  const coverage = serviceMethodCoverage(serviceSource);
  const rawSqlInsideService = /knowledge_graph_edges|SELECT\s+|INSERT\s+|UPDATE\s+|DELETE\s+/i.test(serviceSource);
  const entitySpecificBranching = /entityType\s*===|switch\s*\(\s*entityType|type\s*===\s*["']MOVIE["']/i.test(serviceSource);

  const pool = createPool();
  const client = await pool.connect();
  try {
    const sample = await rows(
      client,
      `SELECT source_type, source_id, relation_type, target_type, target_id
       FROM knowledge_graph_edges
       ORDER BY source_type, source_id, relation_type, target_type, target_id
       LIMIT 1`,
    );
    const invalidRelationshipCount = await rows(
      client,
      "SELECT COUNT(*)::int AS count FROM knowledge_graph_edges WHERE relation_type = $1",
      ["__INVALID_RELATIONSHIP_TYPE__"],
    );

    const verificationErrors = [];
    if (coverage.some((item) => !item.implemented || !item.repositoryCallsPresent)) {
      verificationErrors.push({ code: "SERVICE_COVERAGE_INCOMPLETE", coverage });
    }
    if (rawSqlInsideService) verificationErrors.push({ code: "RAW_SQL_INSIDE_SERVICE" });
    if (entitySpecificBranching) verificationErrors.push({ code: "ENTITY_SPECIFIC_BRANCHING" });
    if (duplicates.length > 0) verificationErrors.push({ code: "DUPLICATED_COMPOSITION", duplicates });
    if (sample.length < 1) verificationErrors.push({ code: "NO_SAMPLE_RELATIONSHIP" });
    if (Number(invalidRelationshipCount[0]?.count ?? 0) !== 0) {
      verificationErrors.push({ code: "INVALID_FILTER_NOT_EMPTY" });
    }

    const summary = {
      command: "verify:relationship-service",
      status: verificationErrors.length === 0 ? "PASS" : "FAIL",
      serviceMethods: serviceMethods.length,
      repositoryDependency: !rawSqlInsideService && coverage.every((item) => item.repositoryCallsPresent) ? "PASS" : "FAIL",
      duplicatedComposition: duplicates.length,
      verificationErrors: verificationErrors.length,
      emptyResultBehavior: "Invalid relationship filters produce empty result sets at repository/service boundaries.",
      sampleRelationship: sample[0] ?? null,
      completedAt: new Date().toISOString(),
    };

    await writeArtifact("composition-audit.json", compositionAudit);
    await writeArtifact("service-coverage.json", {
      summary,
      coverage,
      registeredRelationshipTypes: relationshipTypes,
    });
    await writeArtifact("duplicates.json", {
      count: duplicates.length,
      records: duplicates,
    });

    console.log("\nRelationship Service\n");
    console.log(`Service Methods: ${summary.serviceMethods}`);
    console.log("");
    console.log(`Repository Dependency: ${summary.repositoryDependency}`);
    console.log("");
    console.log(`Duplicated Composition: ${summary.duplicatedComposition}`);
    console.log("");
    console.log(`Verification Errors: ${summary.verificationErrors}`);
    console.log("");
    console.log(`Status: ${summary.status}`);

    if (summary.status !== "PASS") {
      console.log(JSON.stringify(verificationErrors, null, 2));
      process.exitCode = 1;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
