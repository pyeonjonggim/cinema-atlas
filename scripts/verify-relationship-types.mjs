import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { createPool, hasDatabaseUrl, repoRoot } from "./lib/postgres-pilot-utils.mjs";

const artifactRoot = path.join(repoRoot, "data", "imports", "relationship-types");
const registryPath = path.join(repoRoot, "lib", "relationships", "relationshipRegistry.ts");
const scanRoots = ["types", "lib", "scripts", "app", "components", "docs"];
const sourceExtensions = new Set([".ts", ".tsx", ".mjs", ".js", ".md"]);
const confidenceValues = new Set(["exact", "high", "medium", "low", "editorial-confirmed"]);

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
  return {
    relationshipRegistry: sandbox.exports.relationshipRegistry,
    persistedEntityTypeToCanonical: sandbox.exports.persistedEntityTypeToCanonical,
  };
}

async function walkFiles(root) {
  const absoluteRoot = path.join(repoRoot, root);
  const found = [];

  async function walk(current) {
    const entries = await fs.readdir(current, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (["node_modules", ".next", ".git", "data/imports"].includes(entry.name)) continue;
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

async function scanUsageLocations(typeKeys) {
  const usage = Object.fromEntries(typeKeys.map((key) => [key, []]));
  const files = (await Promise.all(scanRoots.map(walkFiles))).flat();

  for (const file of files) {
    const relative = path.relative(repoRoot, file).replace(/\\/g, "/");
    if (relative.startsWith("data/imports/relationship-types/")) continue;
    const content = await fs.readFile(file, "utf8").catch(() => "");
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const key of typeKeys) {
        if (line.includes(key)) {
          usage[key].push({
            file: relative,
            line: index + 1,
          });
        }
      }
    });
  }

  return usage;
}

function canonicalType(value, entityMap) {
  return entityMap[String(value ?? "").toLowerCase()];
}

function validateEdge(edge, registryByKey, entityMap) {
  const definition = registryByKey.get(edge.relation_type);
  if (!definition) {
    return [{
      code: "UNREGISTERED_TYPE",
      edge,
      message: `Relationship type is not registered: ${edge.relation_type}`,
    }];
  }

  const issues = [];
  const sourceType = canonicalType(edge.source_type, entityMap);
  const targetType = canonicalType(edge.target_type, entityMap);
  const primaryPair =
    sourceType === definition.sourceEntityType &&
    targetType === definition.targetEntityType;
  const compatiblePair = definition.compatibleEntityPairs?.some(
    (pair) => pair.sourceEntityType === sourceType && pair.targetEntityType === targetType,
  );

  if (!primaryPair && !compatiblePair) {
    issues.push({
      code: "INVALID_SOURCE_ENTITY_TYPE",
      edge,
      expected: `${definition.sourceEntityType} -> ${definition.targetEntityType}`,
      actual: sourceType ?? edge.source_type,
    });
    issues.push({
      code: "INVALID_TARGET_ENTITY_TYPE",
      edge,
      expected: `${definition.sourceEntityType} -> ${definition.targetEntityType}`,
      actual: targetType ?? edge.target_type,
    });
  }
  if (
    !definition.allowSelfReference &&
    edge.source_type === edge.target_type &&
    edge.source_id === edge.target_id
  ) {
    issues.push({
      code: "INVALID_SELF_REFERENCE",
      edge,
    });
  }
  if (!edge.provenance || typeof edge.provenance !== "object") {
    issues.push({
      code: "INVALID_METADATA",
      edge,
      message: "Provenance must be a structured object.",
    });
  }
  if (edge.confidence && !confidenceValues.has(edge.confidence)) {
    issues.push({
      code: "INVALID_METADATA",
      edge,
      message: `Unsupported confidence value: ${edge.confidence}`,
    });
  }
  if (definition.status === "deprecated") {
    issues.push({
      code: "DEPRECATED_TYPE",
      edge,
    });
  }

  return issues;
}

function registryConflicts(registry) {
  const byKey = registry.reduce((groups, definition) => {
    groups[definition.key] ??= [];
    groups[definition.key].push(definition);
    return groups;
  }, {});

  return Object.entries(byKey)
    .filter(([, definitions]) => definitions.length > 1)
    .map(([key, definitions]) => ({ key, definitions }));
}

function classifyUsage(locations) {
  const files = new Set(locations.map((location) => location.file));
  return {
    createdBySyncOrImport: [...files].filter((file) =>
      /scripts\/(sync|seed|persist|db-seed)|lib\/catalogSync|lib\/editorial\/postgresEditorialRepository/.test(file),
    ),
    queriedByRepositoryOrQuery: [...files].filter((file) =>
      /lib\/catalogQuery|lib\/postgresCatalogRepository|scripts\/verify|scripts\/catalog-query/.test(file),
    ),
    assumedByProjectionOrUi: [...files].filter((file) =>
      /app\/|components\/|lib\/search/.test(file),
    ),
  };
}

async function main() {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is required for verify:relationship-types.");
  }

  const { relationshipRegistry, persistedEntityTypeToCanonical } = await loadRegistry();
  const registryByKey = new Map(relationshipRegistry.map((definition) => [definition.key, definition]));
  const registryKeys = relationshipRegistry.map((definition) => definition.key);
  const usageLocations = await scanUsageLocations(registryKeys);
  const conflicts = registryConflicts(relationshipRegistry);

  const pool = createPool();
  const client = await pool.connect();
  try {
    const storedTypeCounts = await rows(
      client,
      `SELECT source_type, relation_type, target_type, COUNT(*)::int AS count
       FROM knowledge_graph_edges
       GROUP BY source_type, relation_type, target_type
       ORDER BY relation_type, source_type, target_type`,
    );
    const edges = await rows(
      client,
      `SELECT id, source_type, source_id, relation_type, target_type, target_id,
              provenance, confidence, is_curated
       FROM knowledge_graph_edges
       ORDER BY relation_type, source_type, source_id, target_type, target_id`,
    );

    const invalidEdges = edges.flatMap((edge) =>
      validateEdge(edge, registryByKey, persistedEntityTypeToCanonical),
    );
    const unregisteredTypes = [...new Set(
      invalidEdges
        .filter((issue) => issue.code === "UNREGISTERED_TYPE")
        .map((issue) => issue.edge.relation_type),
    )].map((relationType) => ({
      relationType,
      recordCount: edges.filter((edge) => edge.relation_type === relationType).length,
    }));

    const deprecatedTypes = relationshipRegistry
      .filter((definition) => definition.status === "deprecated")
      .map((definition) => definition.key);
    const deprecatedTypesCreated = deprecatedTypes.filter((key) =>
      classifyUsage(usageLocations[key] ?? []).createdBySyncOrImport.length > 0,
    );

    const existingRelationshipTypes = storedTypeCounts.map((row) => {
      const definition = registryByKey.get(row.relation_type);
      const usage = usageLocations[row.relation_type] ?? [];
      return {
        storedTypeValue: row.relation_type,
        sourceEntityType: row.source_type,
        targetEntityType: row.target_type,
        recordCount: Number(row.count),
        usageLocations: usage,
        usageSummary: classifyUsage(usage),
        classificationCandidate: definition?.relationshipClass ?? "UNREGISTERED",
        compatibilityNotes: definition?.compatibilityNotes ?? (
          definition ? "Compatible with the canonical relationship registry." : "Unsupported by the canonical relationship registry."
        ),
      };
    });

    const invalidEntityPairs = invalidEdges.filter((issue) =>
      issue.code === "INVALID_SOURCE_ENTITY_TYPE" || issue.code === "INVALID_TARGET_ENTITY_TYPE",
    );
    const invalidDirections = invalidEdges.filter((issue) => issue.code === "INVALID_SELF_REFERENCE");
    const invalidMetadata = invalidEdges.filter((issue) => issue.code === "INVALID_METADATA");
    const deprecatedTypeIssues = invalidEdges.filter((issue) => issue.code === "DEPRECATED_TYPE");

    const summary = {
      command: "verify:relationship-types",
      status:
        unregisteredTypes.length === 0 &&
        invalidEntityPairs.length === 0 &&
        invalidDirections.length === 0 &&
        invalidMetadata.length === 0 &&
        conflicts.length === 0 &&
        deprecatedTypesCreated.length === 0 &&
        deprecatedTypeIssues.length === 0
          ? "PASS"
          : "FAIL",
      registeredTypes: relationshipRegistry.length,
      databaseTypes: new Set(storedTypeCounts.map((row) => row.relation_type)).size,
      edgesChecked: edges.length,
      unregisteredTypes: unregisteredTypes.length,
      invalidEntityPairs: invalidEntityPairs.length,
      invalidDirections: invalidDirections.length,
      invalidMetadata: invalidMetadata.length,
      registryConflicts: conflicts.length,
      deprecatedTypesCreated: deprecatedTypesCreated.length,
      existingSchemaStrategy: "A. Existing schema is sufficient; application-level contract and validation added only.",
      completedAt: new Date().toISOString(),
    };

    await writeArtifact("summary.json", summary);
    await writeArtifact("existing-relationship-types.json", existingRelationshipTypes);
    await writeArtifact("unregistered-types.json", unregisteredTypes);
    await writeArtifact("invalid-edges.json", invalidEdges);
    await writeArtifact("registry.json", relationshipRegistry);

    console.log("\nRelationship Type Verification\n");
    console.log(`Registered Types: ${summary.registeredTypes}`);
    console.log(`Database Types: ${summary.databaseTypes}`);
    console.log(`Edges Checked: ${summary.edgesChecked}`);
    console.log("");
    console.log(`Unregistered Types: ${summary.unregisteredTypes}`);
    console.log(`Invalid Entity Pairs: ${summary.invalidEntityPairs}`);
    console.log(`Invalid Directions: ${summary.invalidDirections}`);
    console.log(`Invalid Metadata: ${summary.invalidMetadata}`);
    console.log(`Registry Conflicts: ${summary.registryConflicts}`);
    console.log(`Deprecated Types Created: ${summary.deprecatedTypesCreated}`);
    console.log("");
    console.log(`Status: ${summary.status}`);

    if (summary.status !== "PASS") {
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
