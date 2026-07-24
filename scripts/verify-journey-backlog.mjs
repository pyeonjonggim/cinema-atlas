import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const repoRoot = process.cwd();
const artifactRoot = path.join(repoRoot, "data", "imports", "journey-backlog");
const modulePaths = {
  journeys: path.join(repoRoot, "data", "journeys.ts"),
  blueprints: path.join(repoRoot, "data", "journeyBlueprints.ts"),
  difficulty: path.join(repoRoot, "lib", "journeyDifficulty.ts"),
  namingQuality: path.join(repoRoot, "lib", "journeyNamingQuality.ts"),
  similarity: path.join(repoRoot, "lib", "journeySimilarity.ts"),
  factory: path.join(repoRoot, "lib", "journeyFactory.ts"),
  repository: path.join(repoRoot, "lib", "journeyRepository.ts"),
  persistence: path.join(repoRoot, "lib", "journeyCatalogPersistence.ts"),
  journeysLib: path.join(repoRoot, "lib", "journeys.ts"),
  query: path.join(repoRoot, "lib", "journeyQuery.ts"),
};

async function main() {
  const modules = await loadJourneyModules();
  const candidates = modules.factory.buildJourneyCandidates(
    modules.blueprints.journeyBlueprints
  );
  const visibleCandidates = await modules.query.listGeneratedJourneyCandidates();
  const activeCandidates = candidates.filter((candidate) => candidate.status !== "rejected");
  const readyCandidates = activeCandidates.filter(
    (candidate) => candidate.status === "ready-to-publish"
  );
  const reviewCandidates = activeCandidates.filter(
    (candidate) => candidate.status === "needs-editorial-review"
  );
  const activeSimilarityIssues = activeCandidates.flatMap((candidate) => {
    return candidate.validationIssues
      .filter(isSimilarityIssue)
      .map((issue) => ({ journeyId: candidate.id, issue }));
  });
  const activeNamingIssues = activeCandidates.flatMap((candidate) => {
    return candidate.validationIssues
      .filter((issue) => issue.includes("Journey name promises"))
      .map((issue) => ({ journeyId: candidate.id, issue }));
  });
  const duplicateActiveTitles = duplicates(
    activeCandidates.map((candidate) => normalizeTitle(candidate.title))
  );
  const readyNotFilmForward = readyCandidates.filter(
    (candidate) => candidate.movieCount < Math.ceil(candidate.stepCount / 2)
  );
  const categorySummary = summarizeCategories(activeCandidates);
  const errors = [
    ...(visibleCandidates.length < 5
      ? [`Visible generated Journey candidates below target: ${visibleCandidates.length}/5`]
      : []),
    ...(readyCandidates.length < 5
      ? [`Ready Journey candidates below target: ${readyCandidates.length}/5`]
      : []),
    ...duplicateActiveTitles.map((title) => `Duplicate active Journey title: ${title}`),
    ...activeSimilarityIssues.map(
      (issue) => `Active Journey similarity issue: ${issue.journeyId} -> ${issue.issue}`
    ),
    ...activeNamingIssues.map(
      (issue) => `Active Journey naming issue: ${issue.journeyId} -> ${issue.issue}`
    ),
    ...readyNotFilmForward.map(
      (candidate) => `Ready candidate is not film-forward: ${candidate.id}`
    ),
    ...(Object.keys(categorySummary).length < 4
      ? [`Active Journey category diversity below target: ${Object.keys(categorySummary).length}/4`]
      : []),
  ];
  const summary = {
    blueprints: modules.blueprints.journeyBlueprints.length,
    publishedJourneys: modules.journeys.journeys.length,
    visibleCandidates: visibleCandidates.length,
    activeCandidates: activeCandidates.length,
    readyCandidates: readyCandidates.length,
    reviewCandidates: reviewCandidates.length,
    activeSimilarityIssues: activeSimilarityIssues.length,
    activeNamingIssues: activeNamingIssues.length,
    duplicateActiveTitles: duplicateActiveTitles.length,
    categoryCount: Object.keys(categorySummary).length,
    status: errors.length === 0 ? "PASS" : "FAIL",
  };

  await writeArtifact("summary.json", summary);
  await writeArtifact(
    "visible-candidates.json",
    visibleCandidates.map((candidate) => ({
      id: candidate.id,
      title: candidate.title,
      status: candidate.catalogStatus,
      difficulty: candidate.difficulty,
      steps: candidate.steps.length,
      movies: candidate.steps.filter((step) => step.entityType === "movie").length,
    }))
  );
  await writeArtifact("active-candidates.json", activeCandidates);
  await writeArtifact("category-summary.json", categorySummary);
  await writeArtifact("issues.json", {
    errors,
    activeSimilarityIssues,
    activeNamingIssues,
  });

  console.log("Journey Backlog Verification\n");
  console.log(`Published Journeys: ${summary.publishedJourneys}`);
  console.log(`Visible Candidates: ${summary.visibleCandidates}`);
  console.log(`Active Candidates: ${summary.activeCandidates}`);
  console.log(`Ready Candidates: ${summary.readyCandidates}`);
  console.log(`Needs Review: ${summary.reviewCandidates}`);
  console.log(`Categories: ${summary.categoryCount}`);
  console.log(`Active Similarity Issues: ${summary.activeSimilarityIssues}`);
  console.log(`Active Naming Issues: ${summary.activeNamingIssues}`);
  console.log(`Duplicate Active Titles: ${summary.duplicateActiveTitles}`);
  console.log(`\nStatus: ${summary.status}`);

  if (errors.length > 0) {
    process.exitCode = 1;
  }
}

async function loadJourneyModules() {
  const journeys = await loadTypeScriptModule(modulePaths.journeys);
  const blueprints = await loadTypeScriptModule(modulePaths.blueprints, {
    "@/types/journey": {},
  });
  const difficulty = await loadTypeScriptModule(modulePaths.difficulty, {
    "@/data/journeys": journeys,
    "@/types/journey": {},
  });
  const namingQuality = await loadTypeScriptModule(modulePaths.namingQuality, {
    "@/types/journey": {},
  });
  const similarity = await loadTypeScriptModule(modulePaths.similarity, {
    "@/types/journey": {},
  });
  const factory = await loadTypeScriptModule(modulePaths.factory, {
    "@/data/journeyBlueprints": blueprints,
    "@/data/journeys": journeys,
    "@/lib/journeyDifficulty": difficulty,
    "@/lib/journeyNamingQuality": namingQuality,
    "@/lib/journeySimilarity": similarity,
    "@/types/journey": {},
  });
  const repository = await loadTypeScriptModule(modulePaths.repository, {
    "@/types/journey": {},
  });
  const persistence = await loadTypeScriptModule(modulePaths.persistence, {
    "@/data/journeys": journeys,
    "@/lib/journeyFactory": factory,
    "@/types/journey": {},
  });
  const journeysLib = await loadTypeScriptModule(modulePaths.journeysLib, {
    "@/data/actors": { actors: [] },
    "@/data/awards": { awards: [] },
    "@/data/countries": { countries: [] },
    "@/data/directors": { directors: [] },
    "@/data/journeys": journeys,
    "@/data/movements": { movements: [] },
    "@/data/movies": { movies: [] },
    "@/types/journey": {},
  });
  const query = await loadTypeScriptModule(modulePaths.query, {
    "@/lib/journeyRepository": repository,
    "@/lib/journeyCatalogPersistence": persistence,
    "@/lib/journeys": journeysLib,
    "@/lib/journeyDifficulty": difficulty,
    "@/types/journey": {},
  });

  return {
    journeys,
    blueprints,
    factory,
    query,
  };
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

function isSimilarityIssue(issue) {
  return (
    issue.includes("Exact duplicate Journey route") ||
    issue.includes("Near-duplicate Journey route") ||
    issue.includes("High Journey overlap")
  );
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

function normalizeTitle(title) {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

function summarizeCategories(candidates) {
  return candidates.reduce((summary, candidate) => {
    summary[candidate.category] = (summary[candidate.category] ?? 0) + 1;
    return summary;
  }, {});
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
