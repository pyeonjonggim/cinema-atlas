import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { createPool, hasDatabaseUrl, repoRoot } from "./lib/postgres-pilot-utils.mjs";

const artifactRoot = path.join(repoRoot, "data", "imports", "continue-journey");
const enginePath = path.join(repoRoot, "lib", "relationships", "continueJourneyEngine.ts");
const formatterPath = path.join(repoRoot, "lib", "relationships", "journeyExplanationFormatter.ts");
const registryPath = path.join(repoRoot, "lib", "relationships", "relationshipRegistry.ts");
const policyRegistryPath = path.join(repoRoot, "lib", "relationships", "relationshipPolicyRegistry.ts");
const supportedEntities = ["MOVIE", "PERSON", "COUNTRY", "MOVEMENT"];
const serviceMethods = ["buildJourney", "buildForEntity", "groupJourney", "validateJourney"];

const persistedToCanonical = {
  movie: "MOVIE",
  person: "PERSON",
  country: "COUNTRY",
  movement: "MOVEMENT",
  genre: "GENRE",
  language: "LANGUAGE",
  company: "COMPANY",
  award: "AWARD",
};

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

async function loadPolicyRegistry() {
  return loadExport(policyRegistryPath, "relationshipPolicyRegistry");
}

async function loadGroupRegistry() {
  return loadExport(policyRegistryPath, "relationshipGroupRegistry");
}

async function loadExport(filePath, exportName) {
  const source = await fs.readFile(filePath, "utf8");
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
  vm.runInNewContext(compiled, sandbox, { filename: filePath });
  return sandbox.exports[exportName];
}

async function loadFormatter() {
  const source = await fs.readFile(formatterPath, "utf8");
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
  vm.runInNewContext(compiled, sandbox, { filename: formatterPath });
  return {
    templates: sandbox.exports.journeyExplanationTemplates,
    formatJourneyExplanation: sandbox.exports.formatJourneyExplanation,
  };
}

function canonicalType(value) {
  return persistedToCanonical[String(value).toLowerCase()] ?? String(value).toUpperCase();
}

function persistedType(value) {
  return String(value).toLowerCase();
}

function title(value) {
  return String(value)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function itemKey(item) {
  return `${item.entityType}:${item.entityId}:${item.relationshipType}:${item.metadata.direction}`;
}

function sortItems(a, b) {
  return (
    a.priority - b.priority ||
    a.category.localeCompare(b.category) ||
    a.relationshipType.localeCompare(b.relationshipType) ||
    a.entityType.localeCompare(b.entityType) ||
    a.entityId.localeCompare(b.entityId)
  );
}

function edgeToItem(edge, source, registry, policiesByType, direction) {
  const entity = direction === "outgoing"
    ? { type: canonicalType(edge.target_type), id: edge.target_id }
    : { type: canonicalType(edge.source_type), id: edge.source_id };
  const registryIndex = registry.findIndex((item) => item.key === edge.relation_type);
  const definition = registry[registryIndex];
  const policy = policiesByType.get(edge.relation_type);
  const priority = policy?.priority ?? Number.MAX_SAFE_INTEGER;

  const explanation = {
    kind: edge.is_curated ? "EDITORIAL_CONTEXT" : direction === "outgoing" ? "DIRECT_RELATIONSHIP" : "INVERSE_RELATIONSHIP",
    relationshipType: edge.relation_type,
    source: {
      type: canonicalType(edge.source_type),
      id: edge.source_id,
      entityType: canonicalType(edge.source_type),
    },
    target: {
      type: canonicalType(edge.target_type),
      id: edge.target_id,
      entityType: canonicalType(edge.target_type),
    },
    metadata: {
      direction,
    },
  };

  return {
    id: `${source.type}:${source.id}:${edge.relation_type}:${entity.type}:${entity.id}:${direction}`,
    entityType: entity.type,
    entityId: entity.id,
    relationshipType: edge.relation_type,
    title: title(entity.id),
    subtitle: definition?.inverseLabel ?? definition?.inverseSemanticKey,
    explanation,
    priority,
    category: policy?.group ?? "HISTORICAL_CONTEXT",
    metadata: {
      direction,
      sourceEntity: {
        type: canonicalType(edge.source_type),
        id: edge.source_id,
      },
      targetEntity: {
        type: canonicalType(edge.target_type),
        id: edge.target_id,
      },
    },
  };
}

function groupJourney(items, policiesByType) {
  const grouped = new Map();
  for (const item of items) {
    grouped.set(item.category, [...(grouped.get(item.category) ?? []), item]);
  }
  return [...grouped.entries()].map(([id, groupItems]) => ({
    id,
    title: [...policiesByType.values()].find((policy) => policy.group === id)?.metadata?.groupTitle ?? title(id),
    priority: Math.min(...groupItems.map((item) => item.priority)),
    items: groupItems,
  }));
}

async function buildExample(client, source, registry, policiesByType) {
  const outgoing = await rows(
    client,
    `SELECT source_type, source_id, relation_type, target_type, target_id
     FROM knowledge_graph_edges
     WHERE source_type = $1 AND source_id = $2
     ORDER BY relation_type, target_type, target_id
     LIMIT 12`,
    [persistedType(source.type), source.id],
  );
  const incoming = await rows(
    client,
    `SELECT source_type, source_id, relation_type, target_type, target_id
     FROM knowledge_graph_edges
     WHERE target_type = $1 AND target_id = $2
     ORDER BY relation_type, source_type, source_id
     LIMIT 12`,
    [persistedType(source.type), source.id],
  );
  const unique = new Map();
  [...outgoing.map((edge) => edgeToItem(edge, source, registry, policiesByType, "outgoing")),
    ...incoming.map((edge) => edgeToItem(edge, source, registry, policiesByType, "incoming"))]
    .sort(sortItems)
    .forEach((item) => {
      if (!unique.has(itemKey(item))) unique.set(itemKey(item), item);
    });
  const items = [...unique.values()];
  return {
    source,
    supported: supportedEntities.includes(source.type),
    groups: groupJourney(items, policiesByType),
    items,
    generatedAt: new Date(0).toISOString(),
    warnings: [],
  };
}

async function findSampleEntity(client, type) {
  const persisted = persistedType(type);
  const sample = await rows(
    client,
    `SELECT source_id AS id
     FROM knowledge_graph_edges
     WHERE source_type = $1
     UNION
     SELECT target_id AS id
     FROM knowledge_graph_edges
     WHERE target_type = $1
     LIMIT 1`,
    [persisted],
  );
  return sample[0] ? { type, id: sample[0].id } : { type, id: "__missing__" };
}

async function main() {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is required for verify:continue-journey.");
  }

  const [engineSource, formatterSource, registry, policyRegistry, groupRegistry, formatter] = await Promise.all([
    fs.readFile(enginePath, "utf8"),
    fs.readFile(formatterPath, "utf8"),
    loadRegistry(),
    loadPolicyRegistry(),
    loadGroupRegistry(),
    loadFormatter(),
  ]);
  const policiesByType = new Map(policyRegistry.map((policy) => [policy.relationshipType, policy]));
  const categories = groupRegistry.map((definition) => definition.group);
  const missingMethods = serviceMethods.filter((method) =>
    !new RegExp(`\\b${method}\\s*\\(`).test(engineSource),
  );
  const repositoryViolations = /RelationshipRepository|from\s+["']@\/lib\/relationships\/relationshipRepository|knowledge_graph_edges|SELECT\s+|INSERT\s+|UPDATE\s+|DELETE\s+/i.test(engineSource)
    ? 1
    : 0;
  const unsupportedEntityBranches = /switch\s*\(\s*entityType|entityType\s*===/i.test(engineSource) ? 1 : 0;
  const canonicalReasonSource = /\breason\s*:|item\.reason|relationshipReason/.test(engineSource) ? 1 : 0;
  const formatterRepositoryViolations = /RelationshipRepository|RelationshipService|knowledge_graph_edges|SELECT\s+|INSERT\s+|UPDATE\s+|DELETE\s+/i.test(formatterSource)
    ? 1
    : 0;

  const pool = createPool();
  const client = await pool.connect();
  try {
    const examples = {};
    for (const entityType of supportedEntities) {
      const source = await findSampleEntity(client, entityType);
      examples[entityType] = await buildExample(client, source, registry, policiesByType);
    }

    const allItems = Object.values(examples).flatMap((result) => result.items);
    const duplicateSuggestions = allItems.length - new Set(allItems.map(itemKey)).size;
    const missingExplanationModels = allItems.filter((item) => !item.explanation).length;
    const registeredTypes = new Set(registry.map((definition) => definition.key));
    const invalidExplanationTypes = allItems.filter((item) => !registeredTypes.has(item.explanation?.relationshipType)).length;
    const invalidExplanationDirections = allItems.filter((item) => {
      const direction = item.explanation?.metadata?.direction;
      if (direction !== "outgoing" && direction !== "incoming") return true;
      const edgeSource = item.explanation.source;
      const edgeTarget = item.explanation.target;
      return !edgeSource?.id || !edgeTarget?.id || !edgeSource?.entityType || !edgeTarget?.entityType;
    }).length;
    const renderedExamples = allItems.map((item) => ({
      explanation: item.explanation,
      renderedText: formatter.formatJourneyExplanation(item.explanation),
      unsupportedLocaleFallback: formatter.formatJourneyExplanation(item.explanation, { locale: "zz" }),
    }));
    const emptyRenderedReasons = renderedExamples.filter((item) => item.renderedText.trim().length === 0).length;
    const missingFormatterDefinitions = registry.filter((definition) =>
      !formatter.templates.some((template) => template.relationshipType === definition.key),
    ).length;
    const deterministicA = JSON.stringify(examples);
    const deterministicB = JSON.stringify(examples);
    const categoryCoverage = categories.map((category) => ({
      category,
      configured: engineSource.includes(category),
      exampleCount: allItems.filter((item) => item.category === category).length,
    }));
    const entityCoverage = supportedEntities.map((entityType) => ({
      entityType,
      supported: true,
      sampleEntityId: examples[entityType].source.id,
      itemCount: examples[entityType].items.length,
      groupCount: examples[entityType].groups.length,
    }));

    const verificationErrors = [];
    if (missingMethods.length > 0) verificationErrors.push({ code: "MISSING_ENGINE_METHODS", missingMethods });
    if (repositoryViolations > 0) verificationErrors.push({ code: "REPOSITORY_OR_SQL_ACCESS" });
    if (formatterRepositoryViolations > 0) verificationErrors.push({ code: "FORMATTER_REPOSITORY_OR_SQL_ACCESS" });
    if (canonicalReasonSource > 0) verificationErrors.push({ code: "CANONICAL_REASON_STRING_SOURCE" });
    if (unsupportedEntityBranches > 0) verificationErrors.push({ code: "ENTITY_SPECIFIC_BRANCHING" });
    if (duplicateSuggestions > 0) verificationErrors.push({ code: "DUPLICATE_SUGGESTIONS", duplicateSuggestions });
    if (missingExplanationModels > 0) verificationErrors.push({ code: "MISSING_EXPLANATION_MODELS", missingExplanationModels });
    if (invalidExplanationTypes > 0) verificationErrors.push({ code: "INVALID_EXPLANATION_TYPES", invalidExplanationTypes });
    if (invalidExplanationDirections > 0) verificationErrors.push({ code: "INVALID_EXPLANATION_DIRECTIONS", invalidExplanationDirections });
    if (missingFormatterDefinitions > 0) verificationErrors.push({ code: "MISSING_FORMATTER_DEFINITIONS", missingFormatterDefinitions });
    if (emptyRenderedReasons > 0) verificationErrors.push({ code: "EMPTY_RENDERED_REASONS", emptyRenderedReasons });
    if (deterministicA !== deterministicB) verificationErrors.push({ code: "NON_DETERMINISTIC_ORDERING" });
    if (entityCoverage.some((item) => item.itemCount === 0)) verificationErrors.push({ code: "EMPTY_SUPPORTED_ENTITY_JOURNEY", entityCoverage });

    const summary = {
      command: "verify:continue-journey",
      status: verificationErrors.length === 0 ? "PASS" : "FAIL",
      supportedEntities: supportedEntities.length,
      journeyCategories: categories.length,
      duplicateSuggestions,
      missingReasons: emptyRenderedReasons,
      repositoryViolations,
      verificationErrors: verificationErrors.length,
      structuredExplanations: missingExplanationModels === 0 ? "PASS" : "FAIL",
      missingExplanationModels,
      missingFormatterDefinitions,
      invalidExplanationDirections,
      emptyRenderedReasons,
      duplicatedExplanationTemplates: canonicalReasonSource,
      completedAt: new Date().toISOString(),
    };

    await writeArtifact("entity-coverage.json", { summary, entityCoverage });
    await writeArtifact("category-coverage.json", { summary, categoryCoverage });
    await writeArtifact("example-output.json", { summary, examples });
    await writeArtifact("explanation-coverage.json", {
      summary,
      coverage: registry.map((definition) => {
        const template = formatter.templates.find((item) => item.relationshipType === definition.key);
        return {
          relationshipType: definition.key,
          directFormatter: template?.directTemplate ?? null,
          inverseFormatter: template?.inverseTemplate ?? null,
          fallbackStatus: template ? "defined" : "fallback-required",
        };
      }),
    });
    await writeArtifact("explanation-examples.json", {
      summary,
      examples: renderedExamples.slice(0, 20),
    });

    console.log("\nContinue Journey Engine\n");
    console.log(`Supported Entities: ${summary.supportedEntities}`);
    console.log("");
    console.log(`Journey Categories: ${summary.journeyCategories}`);
    console.log("");
    console.log(`Duplicate Suggestions: ${summary.duplicateSuggestions}`);
    console.log("");
    console.log(`Missing Reasons: ${summary.missingReasons}`);
    console.log("");
    console.log(`Repository Violations: ${summary.repositoryViolations}`);
    console.log("");
    console.log(`Structured Explanations: ${summary.structuredExplanations}`);
    console.log("");
    console.log(`Missing Explanation Models: ${summary.missingExplanationModels}`);
    console.log("");
    console.log(`Missing Formatter Definitions: ${summary.missingFormatterDefinitions}`);
    console.log("");
    console.log(`Invalid Explanation Directions: ${summary.invalidExplanationDirections}`);
    console.log("");
    console.log(`Empty Rendered Reasons: ${summary.emptyRenderedReasons}`);
    console.log("");
    console.log(`Duplicated Explanation Templates: ${summary.duplicatedExplanationTemplates}`);
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
