import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { repoRoot } from "./lib/postgres-pilot-utils.mjs";

const artifactRoot = path.join(repoRoot, "data", "imports", "relationship-policy");
const registryPath = path.join(repoRoot, "lib", "relationships", "relationshipRegistry.ts");
const policyRegistryPath = path.join(repoRoot, "lib", "relationships", "relationshipPolicyRegistry.ts");
const policyEnginePath = path.join(repoRoot, "lib", "relationships", "relationshipPolicyEngine.ts");
const continueJourneyPath = path.join(repoRoot, "lib", "relationships", "continueJourneyEngine.ts");

const validCategories = new Set([
  "PEOPLE",
  "PLACES",
  "MOVEMENTS",
  "HISTORY",
  "FILMOGRAPHY",
  "AWARDS",
  "CULTURE",
  "INFLUENCE",
  "PRODUCTION",
  "CONTEXT",
]);
const validVisibility = new Set(["visible", "hidden", "internal", "future"]);
const validGroups = new Set([
  "CONTINUE_WATCHING",
  "EXPLORE_THE_DIRECTOR",
  "DISCOVER_THE_COUNTRY",
  "UNDERSTAND_THE_MOVEMENT",
  "RELATED_PEOPLE",
  "HISTORICAL_CONTEXT",
  "INFLUENCED_BY",
  "SIMILAR_THEMES",
]);

async function writeArtifact(fileName, payload) {
  await fs.mkdir(artifactRoot, { recursive: true });
  await fs.writeFile(path.join(artifactRoot, fileName), JSON.stringify(payload, null, 2));
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

function countBy(items, key) {
  return [...items.reduce((counts, item) => {
    const value = item[key];
    counts.set(value, (counts.get(value) ?? 0) + 1);
    return counts;
  }, new Map()).entries()].map(([value, count]) => ({ value, count }));
}

async function main() {
  const [relationshipRegistry, relationshipPolicyRegistry, policyEngineSource, continueJourneySource] = await Promise.all([
    loadExport(registryPath, "relationshipRegistry"),
    loadExport(policyRegistryPath, "relationshipPolicyRegistry"),
    fs.readFile(policyEnginePath, "utf8"),
    fs.readFile(continueJourneyPath, "utf8"),
  ]);
  const relationshipTypes = relationshipRegistry.map((definition) => definition.key);
  const policyTypes = relationshipPolicyRegistry.map((policy) => policy.relationshipType);
  const duplicatePolicies = policyTypes.filter((type, index) => policyTypes.indexOf(type) !== index);
  const missingPolicies = relationshipTypes.filter((type) => !policyTypes.includes(type));
  const orphanPolicies = policyTypes.filter((type) => !relationshipTypes.includes(type));
  const invalidCategories = relationshipPolicyRegistry.filter((policy) => !validCategories.has(policy.category));
  const invalidVisibility = relationshipPolicyRegistry.filter((policy) => !validVisibility.has(policy.visibility));
  const invalidGroups = relationshipPolicyRegistry.filter((policy) => !validGroups.has(policy.group));
  const invalidPriorities = relationshipPolicyRegistry.filter((policy) =>
    typeof policy.priority !== "number" || !Number.isFinite(policy.priority),
  );
  const prioritySummary = relationshipPolicyRegistry
    .map((policy) => ({
      relationshipType: policy.relationshipType,
      priority: policy.priority,
      group: policy.group,
      category: policy.category,
    }))
    .sort((a, b) => a.priority - b.priority || a.relationshipType.localeCompare(b.relationshipType));
  const categorySummary = countBy(relationshipPolicyRegistry, "category");
  const policyEngineViolations = /knowledge_graph_edges|RelationshipRepository|RelationshipService|SELECT\s+|INSERT\s+|UPDATE\s+|DELETE\s+/i.test(policyEngineSource) ? 1 : 0;
  const embeddedPresentationRules = /const categoryDefinitions|const relationshipCategory|function relationshipPriority|classOffset|registryIndex \+ 1/.test(continueJourneySource) ? 1 : 0;

  const verificationErrors = [];
  if (duplicatePolicies.length > 0) verificationErrors.push({ code: "DUPLICATE_POLICIES", duplicatePolicies });
  if (missingPolicies.length > 0) verificationErrors.push({ code: "MISSING_POLICIES", missingPolicies });
  if (orphanPolicies.length > 0) verificationErrors.push({ code: "ORPHAN_POLICIES", orphanPolicies });
  if (invalidCategories.length > 0) verificationErrors.push({ code: "INVALID_CATEGORIES", invalidCategories });
  if (invalidVisibility.length > 0) verificationErrors.push({ code: "INVALID_VISIBILITY", invalidVisibility });
  if (invalidGroups.length > 0) verificationErrors.push({ code: "INVALID_GROUPS", invalidGroups });
  if (invalidPriorities.length > 0) verificationErrors.push({ code: "INVALID_PRIORITIES", invalidPriorities });
  if (policyEngineViolations > 0) verificationErrors.push({ code: "POLICY_ENGINE_FORBIDDEN_DEPENDENCY" });
  if (embeddedPresentationRules > 0) verificationErrors.push({ code: "EMBEDDED_PRESENTATION_RULES_IN_CONTINUE_JOURNEY" });

  const coverage = relationshipTypes.map((relationshipType) => ({
    relationshipType,
    hasPolicy: policyTypes.includes(relationshipType),
    policy: relationshipPolicyRegistry.find((policy) => policy.relationshipType === relationshipType) ?? null,
  }));
  const summary = {
    command: "verify:relationship-policy",
    status: verificationErrors.length === 0 ? "PASS" : "FAIL",
    registeredPolicies: relationshipPolicyRegistry.length,
    relationshipTypes: relationshipTypes.length,
    coverage: relationshipTypes.length === 0
      ? "0%"
      : `${Math.round(((relationshipTypes.length - missingPolicies.length) / relationshipTypes.length) * 100)}%`,
    duplicatePolicies: duplicatePolicies.length,
    missingPolicies: missingPolicies.length,
    invalidCategories: invalidCategories.length,
    verificationErrors: verificationErrors.length,
    completedAt: new Date().toISOString(),
  };

  await writeArtifact("policies.json", {
    summary,
    policies: relationshipPolicyRegistry,
  });
  await writeArtifact("category-summary.json", {
    summary,
    categories: categorySummary,
  });
  await writeArtifact("priority-summary.json", {
    summary,
    priorities: prioritySummary,
  });
  await writeArtifact("coverage.json", {
    summary,
    coverage,
  });

  console.log("\nRelationship Policy\n");
  console.log(`Registered Policies: ${summary.registeredPolicies}`);
  console.log("");
  console.log(`Coverage: ${summary.coverage}`);
  console.log("");
  console.log(`Duplicate Policies: ${summary.duplicatePolicies}`);
  console.log("");
  console.log(`Missing Policies: ${summary.missingPolicies}`);
  console.log("");
  console.log(`Invalid Categories: ${summary.invalidCategories}`);
  console.log("");
  console.log(`Verification Errors: ${summary.verificationErrors}`);
  console.log("");
  console.log(`Status: ${summary.status}`);

  if (summary.status !== "PASS") {
    console.log(JSON.stringify(verificationErrors, null, 2));
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
