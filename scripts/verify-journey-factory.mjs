import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const repoRoot = process.cwd();
const artifactRoot = path.join(repoRoot, "data", "imports", "journey-factory");
const journeyDataPath = path.join(repoRoot, "data", "journeys.ts");
const blueprintDataPath = path.join(repoRoot, "data", "journeyBlueprints.ts");
const difficultyPath = path.join(repoRoot, "lib", "journeyDifficulty.ts");
const namingQualityPath = path.join(repoRoot, "lib", "journeyNamingQuality.ts");
const similarityPath = path.join(repoRoot, "lib", "journeySimilarity.ts");
const factoryPath = path.join(repoRoot, "lib", "journeyFactory.ts");

async function main() {
  const journeyData = await loadTypeScriptModule(journeyDataPath);
  const blueprintData = await loadTypeScriptModule(blueprintDataPath, {
    "@/types/journey": {},
  });
  const difficultyModule = await loadTypeScriptModule(difficultyPath, {
    "@/data/journeys": journeyData,
    "@/types/journey": {},
  });
  const namingQualityModule = await loadTypeScriptModule(namingQualityPath, {
    "@/types/journey": {},
  });
  const similarityModule = await loadTypeScriptModule(similarityPath, {
    "@/types/journey": {},
  });
  const factoryModule = await loadTypeScriptModule(factoryPath, {
    "@/data/journeyBlueprints": blueprintData,
    "@/data/journeys": journeyData,
    "@/lib/journeyDifficulty": difficultyModule,
    "@/lib/journeyNamingQuality": namingQualityModule,
    "@/lib/journeySimilarity": similarityModule,
    "@/types/journey": {},
  });
  const candidates = factoryModule.buildJourneyCandidates(blueprintData.journeyBlueprints);
  const readyToPublish = candidates.filter(
    (candidate) => candidate.status === "ready-to-publish"
  );
  const needsReview = candidates.filter(
    (candidate) => candidate.status === "needs-editorial-review"
  );
  const duplicateCandidateIds = duplicates(candidates.map((candidate) => candidate.id));
  const lowMovieWeight = candidates.filter(
    (candidate) => candidate.movieCount < Math.ceil(candidate.stepCount / 2)
  );
  const missingDifficulty = candidates.filter(
    (candidate) => !candidate.computedDifficulty || candidate.difficultyScore <= 0
  );
  const approvedBlueprints = blueprintData.journeyBlueprints.filter(
    (blueprint) => blueprint.status === "approved"
  );
  const archivedBlueprints = blueprintData.journeyBlueprints.filter(
    (blueprint) => blueprint.status === "archived"
  );
  const approvedNotReady = candidates.filter((candidate) => {
    const blueprint = blueprintData.journeyBlueprints.find(
      (item) => item.id === candidate.blueprintId
    );
    return blueprint?.status === "approved" && candidate.status !== "ready-to-publish";
  });
  const approvedLowMovieWeight = lowMovieWeight.filter((candidate) => {
    const blueprint = blueprintData.journeyBlueprints.find(
      (item) => item.id === candidate.blueprintId
    );
    return blueprint?.status === "approved";
  });
  const duplicateSimilarityIssues = candidates.flatMap((candidate) => {
    return candidate.validationIssues
      .filter(
        (issue) =>
          issue.includes("Exact duplicate Journey route") ||
          issue.includes("Near-duplicate Journey route") ||
          issue.includes("High Journey overlap")
      )
      .map((issue) => ({ journeyId: candidate.id, issue }));
  });
  const namingIssues = candidates.flatMap((candidate) => {
    return candidate.validationIssues
      .filter((issue) => issue.includes("Journey name promises"))
      .map((issue) => ({ journeyId: candidate.id, issue }));
  });

  const errors = [
    ...duplicateCandidateIds.map((id) => `Duplicate candidate id: ${id}`),
    ...approvedLowMovieWeight.map(
      (candidate) =>
        `Approved candidate is not film-forward: ${candidate.id} has ${candidate.movieCount}/${candidate.stepCount} film stops`
    ),
    ...missingDifficulty.map(
      (candidate) => `Candidate missing computed difficulty: ${candidate.id}`
    ),
    ...approvedNotReady.map(
      (candidate) => `Approved blueprint did not produce publish-ready candidate: ${candidate.id}`
    ),
  ];

  const summary = {
    blueprints: blueprintData.journeyBlueprints.length,
    approvedBlueprints: approvedBlueprints.length,
    archivedBlueprints: archivedBlueprints.length,
    candidates: candidates.length,
    readyToPublish: readyToPublish.length,
    needsEditorialReview: needsReview.length,
    duplicateCandidateIds: duplicateCandidateIds.length,
    lowMovieWeight: lowMovieWeight.length,
    missingDifficulty: missingDifficulty.length,
    approvedNotReady: approvedNotReady.length,
    duplicateSimilarityIssues: duplicateSimilarityIssues.length,
    namingIssues: namingIssues.length,
    status: errors.length === 0 ? "PASS" : "FAIL",
  };

  await writeArtifact("summary.json", summary);
  await writeArtifact("blueprints.json", blueprintData.journeyBlueprints);
  await writeArtifact("candidates.json", candidates);
  await writeArtifact("ready-to-publish.json", readyToPublish);
  await writeArtifact("needs-review.json", needsReview);
  await writeArtifact("issues.json", { errors });
  await writeArtifact("similarity-issues.json", duplicateSimilarityIssues);
  await writeArtifact("naming-issues.json", namingIssues);

  console.log("Journey Factory Verification\n");
  console.log(`Blueprints: ${summary.blueprints}`);
  console.log(`Approved Blueprints: ${summary.approvedBlueprints}`);
  console.log(`Archived Blueprints: ${summary.archivedBlueprints}`);
  console.log(`Candidates: ${summary.candidates}`);
  console.log(`Ready To Publish: ${summary.readyToPublish}`);
  console.log(`Needs Editorial Review: ${summary.needsEditorialReview}`);
  console.log(`Duplicate Candidate IDs: ${summary.duplicateCandidateIds}`);
  console.log(`Low Movie Weight: ${summary.lowMovieWeight}`);
  console.log(`Missing Difficulty: ${summary.missingDifficulty}`);
  console.log(`Approved Not Ready: ${summary.approvedNotReady}`);
  console.log(`Similarity Issues: ${summary.duplicateSimilarityIssues}`);
  console.log(`Naming Issues: ${summary.namingIssues}`);
  console.log(`\nStatus: ${summary.status}`);

  if (errors.length > 0) {
    process.exitCode = 1;
  }
}

async function loadTypeScriptModule(filePath, moduleMap = {}) {
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
    require: (specifier) => {
      if (moduleMap[specifier]) return moduleMap[specifier];
      return {};
    },
  };
  vm.runInNewContext(compiled, sandbox, { filename: filePath });
  return sandbox.exports;
}

async function writeArtifact(fileName, payload) {
  await fs.mkdir(artifactRoot, { recursive: true });
  await fs.writeFile(path.join(artifactRoot, fileName), JSON.stringify(payload, null, 2));
}

function duplicates(values) {
  const seen = new Set();
  const repeated = new Set();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated];
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
