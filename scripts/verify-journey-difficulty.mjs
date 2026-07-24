import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const repoRoot = process.cwd();
const artifactRoot = path.join(repoRoot, "data", "imports", "journey-difficulty");
const journeyDataPath = path.join(repoRoot, "data", "journeys.ts");
const journeyDifficultyPath = path.join(repoRoot, "lib", "journeyDifficulty.ts");
const journeyNamingQualityPath = path.join(
  repoRoot,
  "lib",
  "journeyNamingQuality.ts"
);

async function main() {
  const journeyData = await loadTypeScriptModule(journeyDataPath);
  const difficultyModule = await loadTypeScriptModule(journeyDifficultyPath, {
    "@/data/journeys": journeyData,
    "@/types/journey": {},
  });
  const namingQualityModule = await loadTypeScriptModule(journeyNamingQualityPath, {
    "@/types/journey": {},
  });
  const { journeys } = journeyData;
  const { getJourneyMovieAccessibility, scoreJourneyDifficulty } = difficultyModule;
  const { validateJourneyNameDifficulty } = namingQualityModule;

  const scores = journeys.map((journey) => scoreJourneyDifficulty(journey));
  const mismatches = scores.filter(
    (score) => score.declaredDifficulty !== score.computedDifficulty
  );
  const movieAccessibilities = [];

  for (const score of scores) {
    for (const movie of score.movies) {
      movieAccessibilities.push({
        journeyId: score.journeyId,
        ...getJourneyMovieAccessibility(movie.movieId),
      });
    }
  }

  const unknownAccessibilityMovies = movieAccessibilities.filter(
    (movie) => movie.tier === "unknown"
  );
  const invalidScores = scores.filter(
    (score) =>
      score.score < 0 ||
      score.score >
        score.components.reduce((total, component) => total + component.maxScore, 0) ||
      score.components.some(
        (component) => component.score < 0 || component.score > component.maxScore
      )
  );
  const missingMovieWeight = scores.filter((score) => score.movieCount === 0);
  const namingIssues = scores.flatMap((score) => {
    const journey = journeys.find((item) => item.id === score.journeyId);
    if (!journey) return [];
    return validateJourneyNameDifficulty(journey, score.computedDifficulty).map(
      (issue) => ({
        journeyId: journey.id,
        title: journey.title,
        computedDifficulty: score.computedDifficulty,
        issue,
      })
    );
  });

  const errors = [
    ...mismatches.map(
      (score) =>
        `Difficulty mismatch: ${score.journeyId} declares ${score.declaredDifficulty} but computes ${score.computedDifficulty}`
    ),
    ...unknownAccessibilityMovies.map(
      (movie) => `Unknown movie accessibility: ${movie.journeyId} -> ${movie.movieId}`
    ),
    ...invalidScores.map((score) => `Invalid difficulty score: ${score.journeyId}`),
    ...missingMovieWeight.map(
      (score) => `Journey has no film stops for difficulty scoring: ${score.journeyId}`
    ),
    ...namingIssues.map(
      (issue) => `Journey title/difficulty mismatch: ${issue.journeyId} -> ${issue.issue}`
    ),
  ];

  const summary = {
    journeysChecked: journeys.length,
    difficultyMismatches: mismatches.length,
    unknownAccessibilityMovies: unknownAccessibilityMovies.length,
    invalidScores: invalidScores.length,
    missingMovieWeight: missingMovieWeight.length,
    namingIssues: namingIssues.length,
    status: errors.length === 0 ? "PASS" : "FAIL",
  };

  await writeArtifact("summary.json", summary);
  await writeArtifact("scores.json", scores);
  await writeArtifact("mismatches.json", mismatches);
  await writeArtifact("movie-accessibility.json", movieAccessibilities);
  await writeArtifact("naming-issues.json", namingIssues);
  await writeArtifact("issues.json", { errors });

  console.log("Journey Difficulty Verification\n");
  console.log(`Journeys Checked: ${summary.journeysChecked}`);
  console.log(`Difficulty Mismatches: ${summary.difficultyMismatches}`);
  console.log(`Unknown Accessibility Movies: ${summary.unknownAccessibilityMovies}`);
  console.log(`Invalid Scores: ${summary.invalidScores}`);
  console.log(`Journeys Without Film Weight: ${summary.missingMovieWeight}`);
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

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
