import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const repoRoot = process.cwd();
const artifactRoot = path.join(repoRoot, "data", "imports", "journey-candidate-preview");
const routeFile = path.join(
  repoRoot,
  "app",
  "explore",
  "journeys",
  "candidates",
  "[candidateId]",
  "page.tsx"
);
const candidateCardFile = path.join(
  repoRoot,
  "components",
  "journey",
  "GeneratedJourneyCandidateCard.tsx"
);
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
  const queryModule = await loadJourneyQueryModule();
  const draftCandidate =
    await queryModule.getGeneratedJourneyCandidateById(
      "candidate-korean-contemporary-cinema"
    );
  const archivedCandidateRejected =
    !(await queryModule.getGeneratedJourneyCandidateById(
      "candidate-japanese-cinema-doorway"
    ));
  const publishedJourneyRejected =
    !(await queryModule.getGeneratedJourneyCandidateById("intro-japanese-cinema"));
  const candidateHiddenFromPublic =
    !(await queryModule.getPublishedJourneyById("candidate-korean-contemporary-cinema"));
  const routeSource = await fs.readFile(routeFile, "utf8");
  const cardSource = await fs.readFile(candidateCardFile, "utf8");
  const errors = [];

  if (!draftCandidate) {
    errors.push("Draft candidate detail lookup returned no result.");
  }
  if (!archivedCandidateRejected) {
    errors.push("Archived duplicate candidate was accepted by the preview route.");
  }
  if (!publishedJourneyRejected) {
    errors.push("Published Journey was accepted as a generated candidate.");
  }
  if (!candidateHiddenFromPublic) {
    errors.push("Generated candidate leaked through published Journey lookup.");
  }
  if (!cardSource.includes("/explore/journeys/candidates/")) {
    errors.push("Generated candidate card does not link to the preview route.");
  }
  if (!routeSource.includes("Editorial Preview")) {
    errors.push("Candidate preview route is missing Editorial Preview copy.");
  }
  if (!routeSource.includes("getGeneratedJourneyCandidateById")) {
    errors.push("Candidate preview route does not use the candidate query API.");
  }
  if (!routeSource.includes("notFound")) {
    errors.push("Candidate preview route does not guard invalid candidate IDs.");
  }
  if (routeSource.includes("@/data/journeys")) {
    errors.push("Candidate preview route imports static Journey data directly.");
  }
  if (routeSource.includes("SaveJourneyButton")) {
    errors.push("Candidate preview route exposes SaveJourneyButton.");
  }

  const previewCandidate = draftCandidate
    ? {
        id: draftCandidate.id,
        title: draftCandidate.title,
        status: draftCandidate.catalogStatus,
        visibility: draftCandidate.visibility,
        steps: draftCandidate.steps.length,
        movieSteps: draftCandidate.steps.filter(
          (step) => step.entityType === "movie"
        ).length,
      }
    : null;
  const summary = {
    previewRoute: path.relative(repoRoot, routeFile),
    cardLinked: cardSource.includes("/explore/journeys/candidates/"),
    draftCandidateFound: Boolean(draftCandidate),
    archivedCandidateRejected,
    publishedJourneyRejected,
    candidateHiddenFromPublic,
    routeUsesCandidateQuery: routeSource.includes("getGeneratedJourneyCandidateById"),
    staticDataImports: routeSource.includes("@/data/journeys") ? 1 : 0,
    saveButtonExposed: routeSource.includes("SaveJourneyButton"),
    status: errors.length === 0 ? "PASS" : "FAIL",
  };

  await writeArtifact("summary.json", summary);
  await writeArtifact("preview-candidate.json", previewCandidate);
  await writeArtifact("issues.json", { errors });

  console.log("Journey Candidate Preview Verification\n");
  console.log(`Preview Route: ${summary.previewRoute}`);
  console.log(`Card Linked: ${summary.cardLinked ? "PASS" : "FAIL"}`);
  console.log(
    `Draft Candidate Lookup: ${summary.draftCandidateFound ? "PASS" : "FAIL"}`
  );
  console.log(
    `Archived Candidate Rejected: ${summary.archivedCandidateRejected ? "PASS" : "FAIL"}`
  );
  console.log(
    `Published Journey Rejected: ${summary.publishedJourneyRejected ? "PASS" : "FAIL"}`
  );
  console.log(
    `Candidates Hidden From Public Lookup: ${summary.candidateHiddenFromPublic ? "PASS" : "FAIL"}`
  );
  console.log(`Static Data Imports: ${summary.staticDataImports}`);
  console.log(`Save Button Exposed: ${summary.saveButtonExposed ? "FAIL" : "PASS"}`);
  console.log(`\nStatus: ${summary.status}`);

  if (errors.length > 0) {
    process.exitCode = 1;
  }
}

async function loadJourneyQueryModule() {
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
  const journeysLib = await loadTypeScriptModule(modulePaths.journeysLib, {
    "@/data/actors": { actors: [] },
    "@/data/awards": { awards: [] },
    "@/data/countries": { countries: [] },
    "@/data/directors": { directors: [] },
    "@/data/journeys": journeyData,
    "@/data/movements": { movements: [] },
    "@/data/movies": { movies: [] },
    "@/types/journey": {},
  });

  return loadTypeScriptModule(modulePaths.query, {
    "@/lib/journeyRepository": repositoryModule,
    "@/lib/journeyCatalogPersistence": persistenceModule,
    "@/lib/journeys": journeysLib,
    "@/lib/journeyDifficulty": difficultyModule,
    "@/types/journey": {},
  });
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
