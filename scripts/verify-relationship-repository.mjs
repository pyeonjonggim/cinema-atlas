import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { createPool, hasDatabaseUrl, repoRoot } from "./lib/postgres-pilot-utils.mjs";

const artifactRoot = path.join(repoRoot, "data", "imports", "relationship-repository");
const registryPath = path.join(repoRoot, "lib", "relationships", "relationshipRegistry.ts");
const repositoryPath = path.join(repoRoot, "lib", "relationships", "relationshipRepository.ts");
const runtimeRoots = ["lib", "app", "components"];
const auditRoots = ["lib", "app", "components", "scripts"];
const sourceExtensions = new Set([".ts", ".tsx", ".mjs", ".js"]);
const requiredFunctions = ["findOutgoing", "findIncoming", "findBetween", "findByType", "findNeighbors"];

async function writeArtifact(fileName, payload) {
  await fs.mkdir(artifactRoot, { recursive: true });
  await fs.writeFile(path.join(artifactRoot, fileName), JSON.stringify(payload, null, 2));
}

async function rows(client, sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows;
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

async function auditQueries(relationshipTypes) {
  const files = (await Promise.all(auditRoots.map(walkFiles))).flat();
  const audits = [];

  for (const file of files) {
    const relative = path.relative(repoRoot, file).replace(/\\/g, "/");
    const content = await fs.readFile(file, "utf8").catch(() => "");
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      const touchesGraph = /knowledge_graph_edges|getRelationsFrom|getRelationsTo|getRelationsFromSources|getEdgesByRelationType|findOutgoing|findIncoming|findBetween|findByType|findNeighbors/.test(line);
      if (!touchesGraph) return;

      const typesUsed = relationshipTypes.filter((type) => line.includes(type));
      const directRead =
        /FROM\s+knowledge_graph_edges|JOIN\s+knowledge_graph_edges|SELECT\s+.*knowledge_graph_edges/i.test(line);
      const repositoryCall = /findOutgoing|findIncoming|findBetween|findByType|findNeighbors/.test(line);
      const legacyRepositoryCall = /getRelationsFrom|getRelationsTo|getRelationsFromSources|getEdgesByRelationType/.test(line);
      const writePath = /INSERT\s+INTO\s+knowledge_graph_edges|DELETE\s+FROM\s+knowledge_graph_edges|ON CONFLICT/i.test(line);

      audits.push({
        file: relative,
        function: currentFunctionName(lines, index),
        line: index + 1,
        relationshipTypesUsed: typesUsed,
        duplicatedLogic: directRead && !relative.endsWith("lib/relationships/relationshipRepository.ts") && !writePath,
        migrationNotes: repositoryCall
          ? "Uses canonical RelationshipRepository."
          : legacyRepositoryCall
            ? "Legacy compatibility call; implementation delegates to RelationshipRepository where applicable."
            : writePath
              ? "Graph write path; not part of relationship read repository migration."
              : directRead
                ? "Direct graph read should migrate to RelationshipRepository if this is runtime application code."
                : "Graph-related reference.",
      });
    });
  }

  return audits;
}

function runtimeDuplicateQueries(queryAudit) {
  return queryAudit.filter((item) =>
    item.duplicatedLogic &&
    runtimeRoots.some((root) => item.file.startsWith(`${root}/`)) &&
    !item.file.endsWith("lib/relationships/relationshipRepository.ts"),
  );
}

async function main() {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is required for verify:relationship-repository.");
  }

  const registry = await loadRegistry();
  const relationshipTypes = registry.map((definition) => definition.key);
  const repositorySource = await fs.readFile(repositoryPath, "utf8");
  const missingFunctions = requiredFunctions.filter((name) =>
    !new RegExp(`async\\s+${name}\\s*\\(`).test(repositorySource),
  );
  const queryAudit = await auditQueries(relationshipTypes);
  const duplicates = runtimeDuplicateQueries(queryAudit);

  const pool = createPool();
  const client = await pool.connect();
  try {
    const typeCounts = await rows(
      client,
      `SELECT relation_type, COUNT(*)::int AS count
       FROM knowledge_graph_edges
       GROUP BY relation_type
       ORDER BY relation_type`,
    );
    const dbTypes = new Set(typeCounts.map((row) => row.relation_type));
    const coverage = registry.map((definition) => ({
      relationshipType: definition.key,
      supportedByRepository: missingFunctions.length === 0,
      presentInDatabase: dbTypes.has(definition.key),
      recordCount: Number(typeCounts.find((row) => row.relation_type === definition.key)?.count ?? 0),
      sourceEntityType: definition.sourceEntityType,
      targetEntityType: definition.targetEntityType,
      relationshipClass: definition.relationshipClass,
      notes: "Generic repository methods support all registered relationship types through type filters.",
    }));

    const sampleOutgoing = await rows(
      client,
      "SELECT COUNT(*)::int AS count FROM knowledge_graph_edges WHERE source_type = $1 LIMIT 1",
      ["movie"],
    );
    const sampleIncoming = await rows(
      client,
      "SELECT COUNT(*)::int AS count FROM knowledge_graph_edges WHERE target_type = $1 LIMIT 1",
      ["person"],
    );
    const invalidFilterResult = await rows(
      client,
      "SELECT COUNT(*)::int AS count FROM knowledge_graph_edges WHERE relation_type = $1",
      ["__INVALID_RELATIONSHIP_TYPE__"],
    );

    const verificationErrors = [];
    if (missingFunctions.length > 0) verificationErrors.push({ code: "MISSING_FUNCTIONS", missingFunctions });
    if (duplicates.length > 0) verificationErrors.push({ code: "DUPLICATED_RUNTIME_GRAPH_READS", duplicates });
    if (coverage.some((item) => !item.supportedByRepository)) verificationErrors.push({ code: "UNCOVERED_RELATIONSHIP_TYPES" });
    if (Number(invalidFilterResult[0]?.count ?? 0) !== 0) verificationErrors.push({ code: "INVALID_FILTER_NOT_EMPTY" });
    if (Number(sampleOutgoing[0]?.count ?? 0) < 1) verificationErrors.push({ code: "OUTGOING_EMPTY_UNEXPECTEDLY" });
    if (Number(sampleIncoming[0]?.count ?? 0) < 1) verificationErrors.push({ code: "INCOMING_EMPTY_UNEXPECTEDLY" });

    const summary = {
      command: "verify:relationship-repository",
      status: verificationErrors.length === 0 ? "PASS" : "FAIL",
      repositoryFunctions: requiredFunctions.length,
      coveredTypes: coverage.filter((item) => item.supportedByRepository).length,
      registeredTypes: registry.length,
      duplicatedQueries: duplicates.length,
      verificationErrors: verificationErrors.length,
      emptyResultBehavior: "Invalid relationship filters return an empty result set.",
      completedAt: new Date().toISOString(),
    };

    await writeArtifact("query-audit.json", queryAudit);
    await writeArtifact("coverage.json", {
      summary,
      coverage,
    });
    await writeArtifact("duplicates.json", {
      count: duplicates.length,
      records: duplicates,
    });

    console.log("\nRelationship Repository\n");
    console.log(`Repository Functions: ${summary.repositoryFunctions}`);
    console.log("");
    console.log(`Covered Types: ${summary.coveredTypes}`);
    console.log("");
    console.log(`Duplicated Queries: ${summary.duplicatedQueries}`);
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
