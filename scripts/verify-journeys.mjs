import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const repoRoot = process.cwd();
const artifactRoot = path.join(repoRoot, "data", "imports", "journeys");
const journeyDataPath = path.join(repoRoot, "data", "journeys.ts");
const discoveryPath = path.join(repoRoot, "lib", "journeyDiscovery.ts");
const saveButtonPath = path.join(repoRoot, "components", "journey", "SaveJourneyButton.tsx");

async function main() {
  const { journeys, journeySteps } = await loadJourneyData();
  const discoverySource = await fs.readFile(discoveryPath, "utf8");
  const saveButtonSource = await fs.readFile(saveButtonPath, "utf8");

  const journeyIds = new Set(journeys.map((journey) => journey.id));
  const stepIds = new Set(journeySteps.map((step) => step.id));
  const duplicateJourneyIds = duplicates(journeys.map((journey) => journey.id));
  const duplicateStepIds = duplicates(journeySteps.map((step) => step.id));
  const missingStepReferences = [];
  const orphanSteps = [];
  const duplicateOrders = [];
  const shortJourneys = [];
  const lowMovieWeightJourneys = [];
  const longContextRuns = [];

  for (const journey of journeys) {
    const orders = new Set();
    const journeyStepRecords = journeySteps.filter((step) => step.journeyId === journey.id);

    for (const stepId of journey.stepIds) {
      if (!stepIds.has(stepId)) {
        missingStepReferences.push({ journeyId: journey.id, stepId });
      }
    }

    for (const step of journeyStepRecords) {
      if (orders.has(step.order)) {
        duplicateOrders.push({ journeyId: journey.id, order: step.order });
      }
      orders.add(step.order);
    }

    if (journey.official && journeyStepRecords.length < 8) {
      shortJourneys.push({ journeyId: journey.id, steps: journeyStepRecords.length });
    }

    const movieSteps = journeyStepRecords.filter((step) => step.entityType === "movie").length;
    if (journey.official && movieSteps < Math.ceil(journeyStepRecords.length / 2)) {
      lowMovieWeightJourneys.push({
        journeyId: journey.id,
        movieSteps,
        totalSteps: journeyStepRecords.length,
      });
    }

    let contextRun = 0;
    for (const step of journeyStepRecords.sort((a, b) => a.order - b.order)) {
      if (step.entityType === "movie") {
        contextRun = 0;
      } else {
        contextRun += 1;
      }

      if (contextRun > 3) {
        longContextRuns.push({ journeyId: journey.id, order: step.order });
        break;
      }
    }
  }

  for (const step of journeySteps) {
    if (!journeyIds.has(step.journeyId)) {
      orphanSteps.push({ stepId: step.id, journeyId: step.journeyId });
    }
  }

  const usesMathRandom = discoverySource.includes("Math.random");
  const hasDiscoveryCriteria = discoverySource.includes("JourneyDiscoveryCriteria");
  const hasSavedJourneyStorage =
    saveButtonSource.includes("SavedJourneyRecord") &&
    saveButtonSource.includes("localStorage");

  const errors = [
    ...duplicateJourneyIds.map((id) => `Duplicate journey id: ${id}`),
    ...duplicateStepIds.map((id) => `Duplicate journey step id: ${id}`),
    ...missingStepReferences.map((item) => `Missing step reference: ${item.journeyId} -> ${item.stepId}`),
    ...orphanSteps.map((item) => `Orphan step: ${item.stepId} -> ${item.journeyId}`),
    ...duplicateOrders.map((item) => `Duplicate step order: ${item.journeyId} order ${item.order}`),
    ...shortJourneys.map((item) => `Official journey too short: ${item.journeyId} has ${item.steps} steps`),
    ...lowMovieWeightJourneys.map(
      (item) =>
        `Official journey is not movie-forward: ${item.journeyId} has ${item.movieSteps}/${item.totalSteps} movie steps`
    ),
    ...longContextRuns.map(
      (item) =>
        `Journey has too many context steps in a row: ${item.journeyId} near order ${item.order}`
    ),
  ];

  if (usesMathRandom) errors.push("Journey discovery must not use Math.random.");
  if (!hasDiscoveryCriteria) errors.push("Journey discovery criteria model is not used.");
  if (!hasSavedJourneyStorage) errors.push("Save Journey local storage model is missing.");

  const summary = {
    journeys: journeys.length,
    officialJourneys: journeys.filter((journey) => journey.official).length,
    steps: journeySteps.length,
    averageSteps: round(journeySteps.length / Math.max(journeys.length, 1)),
    duplicateJourneyIds,
    duplicateStepIds,
    missingStepReferences,
    orphanSteps,
    duplicateOrders,
    shortJourneys,
    lowMovieWeightJourneys,
    longContextRuns,
    deterministicDiscovery: !usesMathRandom,
    savedJourneyAvailable: hasSavedJourneyStorage,
    status: errors.length === 0 ? "PASS" : "FAIL",
  };

  await writeArtifact("summary.json", summary);
  await writeArtifact(
    "journey-lengths.json",
    journeys.map((journey) => ({
      id: journey.id,
      title: journey.title,
      steps: journeySteps.filter((step) => step.journeyId === journey.id).length,
      estimatedMovies: journey.estimatedMovies,
      estimatedHours: journey.estimatedHours,
    }))
  );
  await writeArtifact("issues.json", { errors });

  console.log("Journey Verification\n");
  console.log(`Journeys: ${summary.journeys}`);
  console.log(`Official Journeys: ${summary.officialJourneys}`);
  console.log(`Steps: ${summary.steps}`);
  console.log(`Average Steps: ${summary.averageSteps}`);
  console.log(`Duplicate Journey IDs: ${duplicateJourneyIds.length}`);
  console.log(`Duplicate Step IDs: ${duplicateStepIds.length}`);
  console.log(`Missing Step References: ${missingStepReferences.length}`);
  console.log(`Orphan Steps: ${orphanSteps.length}`);
  console.log(`Official Short Journeys: ${shortJourneys.length}`);
  console.log(`Low Movie Weight Journeys: ${lowMovieWeightJourneys.length}`);
  console.log(`Long Context Runs: ${longContextRuns.length}`);
  console.log(`Deterministic Discovery: ${summary.deterministicDiscovery ? "PASS" : "FAIL"}`);
  console.log(`Saved Journey Model: ${summary.savedJourneyAvailable ? "PASS" : "FAIL"}`);
  console.log(`\nStatus: ${summary.status}`);

  if (errors.length > 0) {
    process.exitCode = 1;
  }
}

async function loadJourneyData() {
  const source = await fs.readFile(journeyDataPath, "utf8");
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
  vm.runInNewContext(compiled, sandbox, { filename: journeyDataPath });
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

function round(value) {
  return Math.round(value * 10) / 10;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
