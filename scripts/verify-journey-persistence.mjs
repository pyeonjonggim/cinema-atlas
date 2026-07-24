import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const repoRoot = process.cwd();
const artifactRoot = path.join(repoRoot, "data", "imports", "journey-persistence");
const modulePaths = {
  journeys: path.join(repoRoot, "data", "journeys.ts"),
  blueprints: path.join(repoRoot, "data", "journeyBlueprints.ts"),
  difficulty: path.join(repoRoot, "lib", "journeyDifficulty.ts"),
  namingQuality: path.join(repoRoot, "lib", "journeyNamingQuality.ts"),
  similarity: path.join(repoRoot, "lib", "journeySimilarity.ts"),
  factory: path.join(repoRoot, "lib", "journeyFactory.ts"),
  repository: path.join(repoRoot, "lib", "journeyRepository.ts"),
  persistence: path.join(repoRoot, "lib", "journeyCatalogPersistence.ts"),
};

async function main() {
  const journeyData = await loadTypeScriptModule(modulePaths.journeys);
  const blueprintData = await loadTypeScriptModule(modulePaths.blueprints, {
    "@/types/journey": {},
  });
  const difficultyModule = await loadTypeScriptModule(modulePaths.difficulty, {
    "@/data/journeys": journeyData,
    "@/types/journey": {},
  });
  const namingQualityModule = await loadTypeScriptModule(modulePaths.namingQuality, {
    "@/types/journey": {},
  });
  const similarityModule = await loadTypeScriptModule(modulePaths.similarity, {
    "@/types/journey": {},
  });
  const factoryModule = await loadTypeScriptModule(modulePaths.factory, {
    "@/data/journeyBlueprints": blueprintData,
    "@/data/journeys": journeyData,
    "@/lib/journeyDifficulty": difficultyModule,
    "@/lib/journeyNamingQuality": namingQualityModule,
    "@/lib/journeySimilarity": similarityModule,
    "@/types/journey": {},
  });
  const repositoryModule = await loadTypeScriptModule(modulePaths.repository, {
    "@/types/journey": {},
  });
  const persistenceModule = await loadTypeScriptModule(modulePaths.persistence, {
    "@/data/journeys": journeyData,
    "@/lib/journeyFactory": factoryModule,
    "@/types/journey": {},
  });

  const repository = new repositoryModule.InMemoryJourneyRepository();
  const firstSnapshot = await persistenceModule.seedJourneyCatalogRepository(repository);
  const secondSnapshot = await persistenceModule.seedJourneyCatalogRepository(repository);
  const savedJourney = await repository.saveJourney(
    persistenceModule.createSavedJourneyRecord("intro-japanese-cinema")
  );
  const savedJourneyAgain = await repository.saveJourney({
    ...persistenceModule.createSavedJourneyRecord("intro-japanese-cinema"),
    status: "in_progress",
    currentStepId: "intro-japanese-cinema-rashomon",
  });
  const finalSnapshot = repository.snapshot();
  const snapshotIssues =
    persistenceModule.validateJourneyCatalogSnapshot(finalSnapshot);

  const publishedJourneys = finalSnapshot.journeys.filter(
    (journey) => journey.catalogStatus === "published"
  );
  const reviewJourneys = finalSnapshot.journeys.filter(
    (journey) => journey.catalogStatus === "review"
  );
  const draftJourneys = finalSnapshot.journeys.filter(
    (journey) => journey.catalogStatus === "draft"
  );
  const duplicateJourneyIds = duplicates(finalSnapshot.journeys.map((journey) => journey.id));
  const duplicateStepIds = duplicates(finalSnapshot.steps.map((step) => step.id));
  const reimportStable =
    firstSnapshot.journeys.length === secondSnapshot.journeys.length &&
    firstSnapshot.steps.length === secondSnapshot.steps.length;
  const savedJourneyDeduped = finalSnapshot.savedJourneys.length === 1;
  const savedJourneyUpdated =
    savedJourney.id === savedJourneyAgain.id &&
    savedJourneyAgain.status === "in_progress";

  const errors = [
    ...snapshotIssues,
    ...duplicateJourneyIds.map((id) => `Duplicate journey id: ${id}`),
    ...duplicateStepIds.map((id) => `Duplicate step id: ${id}`),
  ];
  if (!reimportStable) errors.push("Re-import changed journey or step counts.");
  if (!savedJourneyDeduped) errors.push("Saved Journey was duplicated.");
  if (!savedJourneyUpdated) errors.push("Saved Journey update was not idempotent.");
  if (publishedJourneys.length !== journeyData.journeys.length) {
    errors.push("Published Journey count does not match source Journey count.");
  }

  const summary = {
    sourceJourneys: journeyData.journeys.length,
    repositoryJourneys: finalSnapshot.journeys.length,
    repositorySteps: finalSnapshot.steps.length,
    publishedJourneys: publishedJourneys.length,
    reviewJourneys: reviewJourneys.length,
    draftJourneys: draftJourneys.length,
    savedJourneys: finalSnapshot.savedJourneys.length,
    duplicateJourneyIds: duplicateJourneyIds.length,
    duplicateStepIds: duplicateStepIds.length,
    reimportStable,
    savedJourneyDeduped,
    savedJourneyUpdated,
    status: errors.length === 0 ? "PASS" : "FAIL",
  };

  await writeArtifact("summary.json", summary);
  await writeArtifact("journeys.json", finalSnapshot.journeys);
  await writeArtifact("steps.json", finalSnapshot.steps);
  await writeArtifact("saved-journeys.json", finalSnapshot.savedJourneys);
  await writeArtifact("issues.json", { errors });

  console.log("Journey Persistence Verification\n");
  console.log(`Source Journeys: ${summary.sourceJourneys}`);
  console.log(`Repository Journeys: ${summary.repositoryJourneys}`);
  console.log(`Repository Steps: ${summary.repositorySteps}`);
  console.log(`Published: ${summary.publishedJourneys}`);
  console.log(`Review: ${summary.reviewJourneys}`);
  console.log(`Draft: ${summary.draftJourneys}`);
  console.log(`Saved Journeys: ${summary.savedJourneys}`);
  console.log(`Duplicate Journey IDs: ${summary.duplicateJourneyIds}`);
  console.log(`Duplicate Step IDs: ${summary.duplicateStepIds}`);
  console.log(`Re-import Stable: ${summary.reimportStable ? "PASS" : "FAIL"}`);
  console.log(`Saved Journey Idempotency: ${summary.savedJourneyDeduped ? "PASS" : "FAIL"}`);
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
