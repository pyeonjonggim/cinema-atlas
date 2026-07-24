import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const repoRoot = process.cwd();
const artifactRoot = path.join(repoRoot, "data", "imports", "journey-promotion");
const modulePaths = {
  journeys: path.join(repoRoot, "data", "journeys.ts"),
  blueprints: path.join(repoRoot, "data", "journeyBlueprints.ts"),
  difficulty: path.join(repoRoot, "lib", "journeyDifficulty.ts"),
  namingQuality: path.join(repoRoot, "lib", "journeyNamingQuality.ts"),
  similarity: path.join(repoRoot, "lib", "journeySimilarity.ts"),
  factory: path.join(repoRoot, "lib", "journeyFactory.ts"),
  repository: path.join(repoRoot, "lib", "journeyRepository.ts"),
  persistence: path.join(repoRoot, "lib", "journeyCatalogPersistence.ts"),
  promotion: path.join(repoRoot, "lib", "journeyPromotion.ts"),
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
  const promotionModule = await loadTypeScriptModule(modulePaths.promotion, {
    "@/types/journey": {},
  });

  const repository = new repositoryModule.InMemoryJourneyRepository();
  await persistenceModule.seedJourneyCatalogRepository(repository);
  const syntheticSteps = journeyData.journeySteps
    .filter((step) => step.journeyId === "new-hollywood-foundations")
    .map((step) => ({
      ...step,
      id: `promotion-test-${step.id}`,
      journeyId: "candidate-promotion-test-route",
    }));
  await repository.upsertJourney(
    {
      id: "candidate-promotion-test-route",
      title: "Promotion Test Route",
      subtitle: "A synthetic review route used only by the promotion verifier.",
      description: "Verifies that a valid review Journey can still be promoted.",
      category: "movement",
      difficulty: "intermediate",
      estimatedMovies: 6,
      estimatedHours: 12,
      official: false,
      authorType: "cinema-atlas",
      author: "Cinema Atlas Verification",
      visibility: "unlisted",
      tags: ["Verification"],
      stepIds: syntheticSteps.map((step) => step.id),
      catalogStatus: "review",
    },
    syntheticSteps
  );
  const before = repository.snapshot();
  const promotionResult =
    await promotionModule.applyJourneyPromotionDecision(repository, {
      journeyId: "candidate-promotion-test-route",
      decision: "promote",
      reason: "Approved as a synthetic publishable Journey.",
      reviewedBy: "cinema-atlas-editorial",
      reviewedAt: "2026-07-24T00:00:00.000Z",
    });
  let invalidPromotionBlocked = false;
  try {
    await promotionModule.applyJourneyPromotionDecision(repository, {
      journeyId: "candidate-korean-contemporary-cinema",
      decision: "promote",
      reason: "Attempt to promote an incomplete draft.",
      reviewedBy: "cinema-atlas-editorial",
      reviewedAt: "2026-07-24T00:00:00.000Z",
    });
  } catch {
    invalidPromotionBlocked = true;
  }
  let archivedPromotionBlocked = false;
  try {
    await promotionModule.applyJourneyPromotionDecision(repository, {
      journeyId: "candidate-japanese-cinema-doorway",
      decision: "promote",
      reason: "Attempt to promote an archived duplicate candidate.",
      reviewedBy: "cinema-atlas-editorial",
      reviewedAt: "2026-07-24T00:00:00.000Z",
    });
  } catch {
    archivedPromotionBlocked = true;
  }

  const after = repository.snapshot();
  const promotedJourney = after.journeys.find(
    (journey) => journey.id === promotionResult.journeyId
  );
  const publishedJourneys = after.journeys.filter(
    (journey) => journey.catalogStatus === "published" && journey.visibility === "public"
  );
  const errors = [];

  if (!promotionResult.promoted) errors.push("Promotion result did not mark journey promoted.");
  if (promotedJourney?.catalogStatus !== "published") {
    errors.push("Promoted Journey is not published.");
  }
  if (promotedJourney?.visibility !== "public") {
    errors.push("Promoted Journey is not public.");
  }
  if (!promotedJourney?.official) {
    errors.push("Promoted Journey is not official.");
  }
  if (!invalidPromotionBlocked) {
    errors.push("Draft Journey promotion was not blocked.");
  }
  if (!archivedPromotionBlocked) {
    errors.push("Archived duplicate Journey promotion was not blocked.");
  }
  if (publishedJourneys.length !== before.journeys.filter((journey) => journey.catalogStatus === "published").length + 1) {
    errors.push("Published Journey count did not increase by exactly one.");
  }

  const summary = {
    beforePublished: before.journeys.filter(
      (journey) => journey.catalogStatus === "published"
    ).length,
    afterPublished: publishedJourneys.length,
    promotedJourneyId: promotionResult.journeyId,
    previousStatus: promotionResult.previousStatus,
    nextStatus: promotionResult.nextStatus,
    invalidPromotionBlocked,
    archivedPromotionBlocked,
    status: errors.length === 0 ? "PASS" : "FAIL",
  };

  await writeArtifact("summary.json", summary);
  await writeArtifact("promotion-result.json", promotionResult);
  await writeArtifact("published-journeys.json", publishedJourneys);
  await writeArtifact("issues.json", { errors });

  console.log("Journey Promotion Verification\n");
  console.log(`Before Published: ${summary.beforePublished}`);
  console.log(`After Published: ${summary.afterPublished}`);
  console.log(`Promoted Journey: ${summary.promotedJourneyId}`);
  console.log(`Previous Status: ${summary.previousStatus}`);
  console.log(`Next Status: ${summary.nextStatus}`);
  console.log(`Invalid Promotion Blocked: ${summary.invalidPromotionBlocked ? "PASS" : "FAIL"}`);
  console.log(`Archived Promotion Blocked: ${summary.archivedPromotionBlocked ? "PASS" : "FAIL"}`);
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

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
