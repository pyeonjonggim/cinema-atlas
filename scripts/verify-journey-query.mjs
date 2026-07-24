import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const repoRoot = process.cwd();
const artifactRoot = path.join(repoRoot, "data", "imports", "journey-query");
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

const migratedUiFiles = [
  "app/explore/page.tsx",
  "app/explore/[routeId]/page.tsx",
  "app/explore/journeys/page.tsx",
  "app/explore/journeys/[journeyId]/page.tsx",
  "app/passport/page.tsx",
  "app/passport/milestones/page.tsx",
  "app/passport/map/page.tsx",
  "app/passport/history/page.tsx",
  "app/passport/challenges/[challengeId]/page.tsx",
  "app/passport/achievements/[achievementId]/page.tsx",
  "components/journey/JourneyCard.tsx",
  "components/journey/JourneyLibrary.tsx",
  "components/journey/RelatedJourneySection.tsx",
];

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
  const queryModule = await loadTypeScriptModule(modulePaths.query, {
    "@/lib/journeyRepository": repositoryModule,
    "@/lib/journeyCatalogPersistence": persistenceModule,
    "@/lib/journeys": journeysLib,
    "@/lib/journeyDifficulty": difficultyModule,
    "@/types/journey": {},
  });

  const publishedJourneys = await queryModule.listPublishedJourneys();
  const generatedCandidates = await queryModule.listGeneratedJourneyCandidates();
  const featuredJourney = await queryModule.selectFeaturedPublishedJourney({
    purpose: "daily-feature",
    minSteps: 8,
    seed: "verify-journey-query",
  });
  const japaneseJourney = await queryModule.getPublishedJourneyById(
    "intro-japanese-cinema"
  );
  const candidateHidden = await queryModule.getPublishedJourneyById(
    "candidate-japanese-cinema-doorway"
  );
  const directStaticImports = await findDirectStaticImports();
  const missingSteps = publishedJourneys.filter((journey) => journey.steps.length === 0);
  const unpublishedVisible = publishedJourneys.filter(
    (journey) => journey.catalogStatus !== "published" || journey.visibility !== "public"
  );
  const errors = [
    ...directStaticImports.map(
      (item) => `Direct static Journey import remains: ${item.file}`
    ),
    ...missingSteps.map((journey) => `Published Journey missing steps: ${journey.id}`),
    ...unpublishedVisible.map(
      (journey) => `Non-published Journey leaked through query: ${journey.id}`
    ),
  ];

  if (publishedJourneys.length !== journeyData.journeys.length) {
    errors.push(
      `Published Journey count mismatch: ${publishedJourneys.length}/${journeyData.journeys.length}`
    );
  }
  if (!featuredJourney) errors.push("Featured Journey query returned no result.");
  if (!japaneseJourney) errors.push("Published Journey detail lookup failed.");
  if (candidateHidden) errors.push("Candidate Journey leaked through published lookup.");
  if (generatedCandidates.length === 0) {
    errors.push("Generated Journey candidate query returned no candidates.");
  }
  if (
    generatedCandidates.some(
      (journey) =>
        journey.catalogStatus === "published" || journey.visibility === "public"
    )
  ) {
    errors.push("Generated candidate query returned a public/published Journey.");
  }

  const summary = {
    publishedJourneys: publishedJourneys.length,
    generatedCandidates: generatedCandidates.length,
    featuredJourneyId: featuredJourney?.id ?? null,
    detailLookup: Boolean(japaneseJourney),
    candidateHidden: !candidateHidden,
    directStaticImports: directStaticImports.length,
    missingSteps: missingSteps.length,
    unpublishedVisible: unpublishedVisible.length,
    status: errors.length === 0 ? "PASS" : "FAIL",
  };

  await writeArtifact("summary.json", summary);
  await writeArtifact(
    "published-journeys.json",
    publishedJourneys.map((journey) => ({
      id: journey.id,
      title: journey.title,
      status: journey.catalogStatus,
      visibility: journey.visibility,
      steps: journey.steps.length,
    }))
  );
  await writeArtifact(
    "generated-candidates.json",
    generatedCandidates.map((journey) => ({
      id: journey.id,
      title: journey.title,
      status: journey.catalogStatus,
      visibility: journey.visibility,
      steps: journey.steps.length,
    }))
  );
  await writeArtifact("direct-static-imports.json", directStaticImports);
  await writeArtifact("issues.json", { errors });

  console.log("Journey Query Verification\n");
  console.log(`Published Journeys: ${summary.publishedJourneys}`);
  console.log(`Generated Candidates: ${summary.generatedCandidates}`);
  console.log(`Featured Journey: ${summary.featuredJourneyId ?? "NONE"}`);
  console.log(`Detail Lookup: ${summary.detailLookup ? "PASS" : "FAIL"}`);
  console.log(`Candidates Hidden: ${summary.candidateHidden ? "PASS" : "FAIL"}`);
  console.log(`Direct Static Imports: ${summary.directStaticImports}`);
  console.log(`Missing Steps: ${summary.missingSteps}`);
  console.log(`Unpublished Visible: ${summary.unpublishedVisible}`);
  console.log(`\nStatus: ${summary.status}`);

  if (errors.length > 0) {
    process.exitCode = 1;
  }
}

async function findDirectStaticImports() {
  const matches = [];
  for (const file of migratedUiFiles) {
    const absolutePath = path.join(repoRoot, file);
    const source = await fs.readFile(absolutePath, "utf8");
    if (
      source.includes("@/data/journeys") ||
      source.includes("officialJourneys") ||
      source.includes("journeySteps")
    ) {
      matches.push({ file });
    }
  }
  return matches;
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
