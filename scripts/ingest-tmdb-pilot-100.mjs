import fs from "node:fs";
import Module from "node:module";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const requireFromScript = Module.createRequire(import.meta.url);
const originalResolveFilename = Module._resolveFilename;
const outputRoot = path.join(rootDir, "data", "imports", "tmdb-pilot-100");

function loadEnvLocal() {
  const envLocalPath = path.join(rootDir, ".env.local");
  if (!fs.existsSync(envLocalPath)) {
    return false;
  }

  const envLines = fs.readFileSync(envLocalPath, "utf8").split(/\r?\n/);
  for (const line of envLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    process.env[key] ??= valueParts.join("=").replace(/^['"]|['"]$/g, "");
  }

  return true;
}

const hasEnvLocal = loadEnvLocal();

Module._resolveFilename = function resolveAlias(request, parent, isMain, options) {
  if (typeof request === "string" && request.startsWith("@/")) {
    return originalResolveFilename.call(
      this,
      path.join(rootDir, request.slice(2)),
      parent,
      isMain,
      options,
    );
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

requireFromScript.extensions[".ts"] = function compileTypeScript(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.Node10,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filename,
  }).outputText;

  module._compile(output, filename);
};

const {
  catalogImportPipeline,
  externalMovieToCanonicalDraft,
  normalizeExternalMovieRecord,
  validateCanonicalMovieDraft,
} = requireFromScript("../lib/catalogImport.ts");
const { createTmdbCatalogProviderFromEnv } = requireFromScript(
  "../lib/catalog/providers/TmdbCatalogProvider.ts",
);

const pilotMovies = [
  { title: "Parasite", year: 2019, tags: ["modern", "asian", "oscar"] },
  { title: "Seven Samurai", year: 1954, tags: ["classic", "asian"] },
  { title: "Spirited Away", year: 2001, tags: ["animation", "asian", "oscar"] },
  { title: "Oldboy", year: 2003, tags: ["asian", "foreign-language"] },
  { title: "The Godfather", year: 1972, tags: ["classic", "oscar"] },
  { title: "Pulp Fiction", year: 1994, tags: ["independent", "modern"] },
  { title: "In the Mood for Love", year: 2000, tags: ["asian", "foreign-language"] },
  { title: "Roma", year: 2018, tags: ["modern", "latin-american"] },
  { title: "City of God", year: 2002, tags: ["latin-american"] },
  { title: "The Seventh Seal", year: 1957, tags: ["classic", "european"] },
  { title: "Citizen Kane", year: 1941, tags: ["classic"] },
  { title: "Casablanca", year: 1942, tags: ["classic", "oscar"] },
  { title: "Vertigo", year: 1958, tags: ["classic"] },
  { title: "2001: A Space Odyssey", year: 1968, tags: ["classic"] },
  { title: "La Dolce Vita", year: 1960, tags: ["european", "foreign-language"] },
  { title: "8½", year: 1963, tags: ["european", "foreign-language"] },
  { title: "Bicycle Thieves", year: 1948, tags: ["classic", "european"] },
  { title: "The Passion of Joan of Arc", year: 1928, tags: ["silent", "european"] },
  { title: "Metropolis", year: 1927, tags: ["silent", "european"] },
  { title: "Nosferatu", year: 1922, tags: ["silent", "european"] },
  { title: "The General", year: 1926, tags: ["silent", "classic"] },
  { title: "Modern Times", year: 1936, tags: ["silent", "classic"] },
  { title: "Sherlock Jr.", year: 1924, tags: ["silent", "short"] },
  { title: "A Trip to the Moon", year: 1902, tags: ["silent", "short"] },
  { title: "Meshes of the Afternoon", year: 1943, tags: ["short", "independent"] },
  { title: "Night and Fog", year: 1956, tags: ["documentary", "short"] },
  { title: "Man with a Movie Camera", year: 1929, tags: ["documentary", "silent"] },
  { title: "Hoop Dreams", year: 1994, tags: ["documentary", "independent"] },
  { title: "The Act of Killing", year: 2012, tags: ["documentary", "modern"] },
  { title: "Shoah", year: 1985, tags: ["documentary"] },
  { title: "Waltz with Bashir", year: 2008, tags: ["documentary", "animation", "middle-eastern"] },
  { title: "The Tale of the Princess Kaguya", year: 2013, tags: ["animation", "asian"] },
  { title: "Akira", year: 1988, tags: ["animation", "asian"] },
  { title: "Grave of the Fireflies", year: 1988, tags: ["animation", "asian"] },
  { title: "Toy Story", year: 1995, tags: ["animation", "modern"] },
  { title: "WALL·E", year: 2008, tags: ["animation", "modern"] },
  { title: "Persepolis", year: 2007, tags: ["animation", "middle-eastern"] },
  { title: "Fantastic Planet", year: 1973, tags: ["animation", "european"] },
  { title: "Pan's Labyrinth", year: 2006, tags: ["european", "foreign-language"] },
  { title: "Amélie", year: 2001, tags: ["european", "foreign-language"] },
  { title: "Breathless", year: 1960, tags: ["european", "foreign-language"] },
  { title: "The 400 Blows", year: 1959, tags: ["european", "foreign-language"] },
  { title: "Cleo from 5 to 7", year: 1962, tags: ["european", "foreign-language"] },
  { title: "The Rules of the Game", year: 1939, tags: ["classic", "european"] },
  { title: "Jeanne Dielman, 23 quai du Commerce, 1080 Bruxelles", year: 1975, tags: ["european"] },
  { title: "Stalker", year: 1979, tags: ["european", "foreign-language"] },
  { title: "Andrei Rublev", year: 1966, tags: ["european", "foreign-language"] },
  { title: "Come and See", year: 1985, tags: ["european", "foreign-language"] },
  { title: "The Lives of Others", year: 2006, tags: ["european", "oscar"] },
  { title: "Cinema Paradiso", year: 1988, tags: ["european", "foreign-language"] },
  { title: "A Separation", year: 2011, tags: ["middle-eastern", "oscar"] },
  { title: "Close-Up", year: 1990, tags: ["middle-eastern"] },
  { title: "Taste of Cherry", year: 1997, tags: ["middle-eastern"] },
  { title: "The Wind Will Carry Us", year: 1999, tags: ["middle-eastern"] },
  { title: "The Salesman", year: 2016, tags: ["middle-eastern", "oscar"] },
  { title: "Capernaum", year: 2018, tags: ["middle-eastern"] },
  { title: "Theeb", year: 2014, tags: ["middle-eastern"] },
  { title: "Wadjda", year: 2012, tags: ["middle-eastern"] },
  { title: "Yojimbo", year: 1961, tags: ["asian"] },
  { title: "Tokyo Story", year: 1953, tags: ["classic", "asian"] },
  { title: "Late Spring", year: 1949, tags: ["classic", "asian"] },
  { title: "Harakiri", year: 1962, tags: ["asian"] },
  { title: "Ugetsu", year: 1953, tags: ["asian"] },
  { title: "Sansho the Bailiff", year: 1954, tags: ["asian"] },
  { title: "Tampopo", year: 1985, tags: ["asian"] },
  { title: "Yi Yi", year: 2000, tags: ["asian"] },
  { title: "A Brighter Summer Day", year: 1991, tags: ["asian"] },
  { title: "Farewell My Concubine", year: 1993, tags: ["asian"] },
  { title: "Raise the Red Lantern", year: 1991, tags: ["asian"] },
  { title: "Crouching Tiger, Hidden Dragon", year: 2000, tags: ["asian", "oscar"] },
  { title: "The Host", year: 2006, tags: ["asian", "title-conflict"] },
  { title: "Memories of Murder", year: 2003, tags: ["asian"] },
  { title: "Burning", year: 2018, tags: ["asian"] },
  { title: "Drive My Car", year: 2021, tags: ["asian", "oscar"] },
  { title: "Shoplifters", year: 2018, tags: ["asian"] },
  { title: "The Handmaiden", year: 2016, tags: ["asian"] },
  { title: "Chungking Express", year: 1994, tags: ["asian"] },
  { title: "Happy Together", year: 1997, tags: ["asian"] },
  { title: "Black Girl", year: 1966, tags: ["african"] },
  { title: "Touki Bouki", year: 1973, tags: ["african"] },
  { title: "Yeelen", year: 1987, tags: ["african"] },
  { title: "Timbuktu", year: 2014, tags: ["african"] },
  { title: "Atlantics", year: 2019, tags: ["african", "modern"] },
  { title: "The Battle of Algiers", year: 1966, tags: ["african", "political"] },
  { title: "Pixote", year: 1980, tags: ["latin-american"] },
  { title: "Central Station", year: 1998, tags: ["latin-american"] },
  { title: "The Secret in Their Eyes", year: 2009, tags: ["latin-american", "oscar"] },
  { title: "Wild Tales", year: 2014, tags: ["latin-american"] },
  { title: "Y Tu Mamá También", year: 2001, tags: ["latin-american"] },
  { title: "The Exterminating Angel", year: 1962, tags: ["latin-american"] },
  { title: "Memories of Underdevelopment", year: 1968, tags: ["latin-american"] },
  { title: "Black Orpheus", year: 1959, tags: ["latin-american", "oscar"] },
  { title: "Moonlight", year: 2016, tags: ["independent", "oscar"] },
  { title: "Crash", year: 2004, tags: ["title-conflict", "oscar"] },
  { title: "Halloween", year: 1978, tags: ["title-conflict"] },
  { title: "Suspiria", year: 1977, tags: ["remake"] },
  { title: "Suspiria", year: 2018, tags: ["remake"] },
  { title: "Oldboy", year: 2013, tags: ["remake"] },
  { title: "A Star Is Born", year: 1937, tags: ["remake"] },
  { title: "A Star Is Born", year: 2018, tags: ["remake"] },
];

const concurrency = 3;
const catalogReadyThreshold = 90;
const contentQualityWeights = {
  searchMatch: 20,
  yearMatch: 15,
  movieDetail: 15,
  credits: 15,
  poster: 5,
  backdrop: 5,
  externalIds: 10,
  normalization: 5,
  validation: 10,
  metadataCompleteness: 10,
};

const reviewReasonPenalties = {
  YEAR_VARIANT: 5,
  MULTIPLE_MATCH: 10,
  POSTER_MISSING: 5,
  BACKDROP_MISSING: 5,
  UNKNOWN_COUNTRY: 5,
  UNKNOWN_LANGUAGE: 5,
  MISSING_RUNTIME: 10,
  MISSING_CREDITS: 15,
  MISSING_IMDB: 10,
  LOW_CONFIDENCE_MATCH: 25,
  VALIDATION_ERROR: 25,
  PROVIDER_ERROR: 25,
};

function ensureOutputDirs() {
  for (const segment of ["raw", "normalized", "canonical", "reports"]) {
    fs.mkdirSync(path.join(outputRoot, segment), { recursive: true });
  }
}

function writeJson(relativePath, data) {
  const target = path.join(outputRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(data, null, 2)}\n`);
}

function hasProviderError(error) {
  return Boolean(error?.catalogError);
}

function chooseBestSearchResult(results, expectedYear) {
  return results.find((result) => result.releaseYear === expectedYear) ?? results[0];
}

function calculateQualityScore(checks) {
  return Math.round(
    Math.min(
    100,
    Object.entries(contentQualityWeights).reduce(
      (total, [key, weight]) => {
        const value = checks[key];
        if (typeof value === "number") {
          return total + weight * value;
        }

        return total + (value ? weight : 0);
      },
      0,
    ),
    ),
  );
}

function applyReviewPenalties(score, reviewReasons) {
  const penalty = reviewReasons.reduce(
    (total, reason) => total + (reviewReasonPenalties[reason.code] ?? 0),
    0,
  );

  return Math.max(0, Math.round(score - penalty));
}

function classifyYearMatch(expectedYear, matchedYear) {
  if (!matchedYear) {
    return "UNKNOWN_YEAR";
  }

  if (matchedYear === expectedYear) {
    return "EXACT_MATCH";
  }

  const delta = Math.abs(matchedYear - expectedYear);
  if (delta === 1) {
    return "WITHIN_ONE_YEAR";
  }

  return "HARD_MISMATCH";
}

function getYearScore(classification) {
  if (classification === "EXACT_MATCH") {
    return true;
  }

  if (classification === "WITHIN_ONE_YEAR") {
    return 0.67;
  }

  return false;
}

function classifyDuplicate(titleKey, candidates) {
  const years = candidates.map((candidate) => candidate.year).filter(Boolean);
  const maxYear = Math.max(...years);
  const minYear = Math.min(...years);
  const hasSameTitleDifferentYears = years.length > 1 && maxYear !== minYear;

  if (["oldboy", "suspiria", "a star is born"].includes(titleKey)) {
    return "REMAKE";
  }

  if (hasSameTitleDifferentYears) {
    return "SAME_TITLE_DIFFERENT_MOVIE";
  }

  return "POSSIBLE_DUPLICATE";
}

function getMetadataCompleteness(record, draft) {
  const fields = [
    record?.metadata.title,
    record?.metadata.originalTitle,
    record?.metadata.releaseDate,
    record?.metadata.runtime,
    record?.metadata.overview,
    draft?.countryIds.length,
    draft?.genreIds.length,
    draft?.languageIds.length,
    record?.metadata.productionCompanyIds?.length,
    record?.credits?.length,
  ];

  const completeCount = fields.filter(Boolean).length;
  return completeCount >= 8;
}

function getPipelineStatus(result) {
  if (
    !result.searchSuccess ||
    !result.detailSuccess ||
    !result.normalizationSuccess ||
    !result.validationSuccess
  ) {
    return "FAILED";
  }

  if (result.reviewRequired || result.contentQualityScore < catalogReadyThreshold) {
    return "WARNING";
  }

  return "PASS";
}

function getQualityBand(score) {
  if (score === 100) {
    return "100";
  }
  if (score >= 90) {
    return "90+";
  }
  if (score >= 80) {
    return "80+";
  }
  if (score >= 70) {
    return "70+";
  }
  return "60-";
}

function createReviewReasons(record, draft, validationIssues, selected, expectedYear, yearClassification, movie) {
  const reasons = [];

  if (yearClassification === "WITHIN_ONE_YEAR") {
    reasons.push({
      code: "YEAR_VARIANT",
      severity: "review",
      message: `Expected ${expectedYear}, matched ${selected?.releaseYear}.`,
    });
  }

  if (yearClassification === "HARD_MISMATCH") {
    reasons.push({
      code: "LOW_CONFIDENCE_MATCH",
      severity: "blocker",
      message: `Expected ${expectedYear}, matched ${selected?.releaseYear ?? "unknown"}.`,
    });
  }

  if (!record?.metadata.runtime) {
    reasons.push({ code: "MISSING_RUNTIME", severity: "review", message: "Runtime is missing." });
  }

  if (
    record?.metadata.runtime &&
    record.metadata.runtime < 40 &&
    !movie.tags.includes("short")
  ) {
    reasons.push({
      code: "LOW_CONFIDENCE_MATCH",
      severity: "blocker",
      message: `Matched runtime is ${record.metadata.runtime} minutes for a non-short pilot movie.`,
    });
  }

  if (!record?.metadata.poster?.path) {
    reasons.push({ code: "POSTER_MISSING", severity: "review", message: "Poster path is missing." });
  }

  if (!record?.metadata.backdrop?.path) {
    reasons.push({ code: "BACKDROP_MISSING", severity: "review", message: "Backdrop path is missing." });
  }

  if (!record?.credits?.length) {
    reasons.push({ code: "MISSING_CREDITS", severity: "blocker", message: "Credits are missing." });
  }

  if (!record?.externalIds.imdbId) {
    reasons.push({ code: "MISSING_IMDB", severity: "review", message: "IMDb ID is missing." });
  }

  if (draft && draft.countryIds.length === 0) {
    reasons.push({ code: "UNKNOWN_COUNTRY", severity: "review", message: "No production country mapped." });
  }

  if (draft && draft.languageIds.length === 0) {
    reasons.push({ code: "UNKNOWN_LANGUAGE", severity: "review", message: "No spoken language mapped." });
  }

  validationIssues
    .filter((issue) => issue.severity === "error")
    .forEach((issue) =>
      reasons.push({
        code: "VALIDATION_ERROR",
        severity: "blocker",
        message: `${issue.field}: ${issue.message}`,
      }),
    );

  return reasons;
}

function buildMismatchList(record, draft, validationIssues, selected, expectedYear) {
  return [
    selected?.releaseYear !== expectedYear ? "Year mismatch" : undefined,
    !record?.metadata.runtime ? "Missing Runtime" : undefined,
    !record?.metadata.poster?.path ? "Missing Poster" : undefined,
    !record?.metadata.backdrop?.path ? "Missing Backdrop" : undefined,
    !record?.credits?.length ? "Missing Credits" : undefined,
    !record?.externalIds.imdbId ? "Missing IMDb" : undefined,
    draft && draft.countryIds.length === 0 ? "Unknown Country" : undefined,
    draft && draft.genreIds.length === 0 ? "Unknown Genre" : undefined,
    ...validationIssues.map((issue) => `${issue.severity}: ${issue.field}`),
  ].filter(Boolean);
}

async function processMovie(provider, movie, index) {
  const start = performance.now();
  const result = {
    index: index + 1,
    expectedTitle: movie.title,
    expectedYear: movie.year,
    tags: movie.tags,
    searchSuccess: false,
    matchSuccess: false,
    detailSuccess: false,
    creditsSuccess: false,
    imagesSuccess: false,
    externalIdsSuccess: false,
    normalizationSuccess: false,
    validationSuccess: false,
    pipelineStatus: "FAILED",
    contentQualityScore: 0,
    qualityScore: 0,
    yearClassification: "UNKNOWN_YEAR",
    reviewRequired: false,
    reviewReasons: [],
    warnings: [],
    providerMovieId: undefined,
    matchedTitle: undefined,
    matchedYear: undefined,
    mismatches: [],
    unresolvedReasons: [],
    timingsMs: {
      search: 0,
      detail: 0,
      normalization: 0,
      validation: 0,
      total: 0,
    },
  };

  try {
    const searchStart = performance.now();
    const searchResults = await provider.searchMovie({
      query: movie.title,
      year: movie.year,
    });
    result.timingsMs.search = Math.round(performance.now() - searchStart);
    result.searchSuccess = searchResults.length > 0;

    const selected = chooseBestSearchResult(searchResults, movie.year);
    result.providerMovieId = selected?.providerMovieId;
    result.matchedTitle = selected?.title;
    result.matchedYear = selected?.releaseYear;
    result.matchSuccess = selected?.releaseYear === movie.year;

    if (!selected) {
      result.reviewReasons.push({
        code: "LOW_CONFIDENCE_MATCH",
        severity: "blocker",
        message: "No search result.",
      });
      result.unresolvedReasons.push("LOW_CONFIDENCE_MATCH");
      result.reviewRequired = true;
      const baseQualityScore = calculateQualityScore({
        searchMatch: false,
        yearMatch: false,
        movieDetail: false,
        credits: false,
        poster: false,
        backdrop: false,
        externalIds: false,
        normalization: false,
        validation: false,
        metadataCompleteness: false,
      });
      result.contentQualityScore = applyReviewPenalties(
        baseQualityScore,
        result.reviewReasons,
      );
      result.qualityScore = result.contentQualityScore;
      result.pipelineStatus = getPipelineStatus(result);
      return { result };
    }

    const detailStart = performance.now();
    const record = await provider.getMovieDetails(selected.providerMovieId);
    result.timingsMs.detail = Math.round(performance.now() - detailStart);

    const normalizedStart = performance.now();
    const normalized = normalizeExternalMovieRecord(record);
    const normalizedBatch = catalogImportPipeline.normalizeExternalMovies([record]);
    result.timingsMs.normalization = Math.round(performance.now() - normalizedStart);

    const validationStart = performance.now();
    const draft = externalMovieToCanonicalDraft(record);
    const validationIssues = validateCanonicalMovieDraft(draft);
    result.timingsMs.validation = Math.round(performance.now() - validationStart);

    const validationErrors = validationIssues.filter((issue) => issue.severity === "error");
    result.yearClassification = classifyYearMatch(movie.year, selected.releaseYear);

    result.detailSuccess = Boolean(
      record.metadata.title &&
        record.metadata.originalTitle &&
        record.metadata.releaseDate &&
        record.metadata.runtime &&
        record.metadata.overview,
    );
    result.creditsSuccess = Boolean(
      record.credits?.some((credit) => credit.role === "director") &&
        record.credits?.some((credit) => credit.role === "actor"),
    );
    result.imagesSuccess = Boolean(record.metadata.poster?.path && record.metadata.backdrop?.path);
    result.externalIdsSuccess = Boolean(record.externalIds.tmdbId && record.externalIds.imdbId);
    result.normalizationSuccess = Boolean(
      normalized && normalizedBatch.issues.every((issue) => issue.severity !== "error"),
    );
    result.validationSuccess = validationErrors.length === 0;
    result.reviewReasons = createReviewReasons(
      record,
      draft,
      validationIssues,
      selected,
      movie.year,
      result.yearClassification,
      movie,
    );
    result.reviewRequired = result.reviewReasons.length > 0;
    result.warnings = validationIssues
      .filter((issue) => issue.severity === "warning")
      .map((issue) => `${issue.field}: ${issue.message}`);
    result.mismatches = buildMismatchList(record, draft, validationIssues, selected, movie.year);
    result.unresolvedReasons = result.reviewReasons.map((reason) => reason.code);
    const baseQualityScore = calculateQualityScore({
      searchMatch: result.searchSuccess,
      yearMatch: getYearScore(result.yearClassification),
      movieDetail: result.detailSuccess,
      credits: result.creditsSuccess,
      poster: Boolean(record.metadata.poster?.path),
      backdrop: Boolean(record.metadata.backdrop?.path),
      externalIds: result.externalIdsSuccess,
      normalization: result.normalizationSuccess,
      validation: result.validationSuccess,
      metadataCompleteness: getMetadataCompleteness(record, draft),
    });
    result.contentQualityScore = applyReviewPenalties(
      baseQualityScore,
      result.reviewReasons,
    );
    result.qualityScore = result.contentQualityScore;
    result.pipelineStatus = getPipelineStatus(result);
    result.timingsMs.total = Math.round(performance.now() - start);

    return {
      result,
      record,
      normalized,
      draft,
    };
  } catch (error) {
    if (hasProviderError(error)) {
      result.reviewReasons.push({
        code: "PROVIDER_ERROR",
        severity: "blocker",
        message: `${error.catalogError.code}: ${error.catalogError.message}`,
      });
      result.unresolvedReasons.push("PROVIDER_ERROR");
    } else {
      result.reviewReasons.push({
        code: "PROVIDER_ERROR",
        severity: "blocker",
        message: error?.message ?? "Unknown error",
      });
      result.unresolvedReasons.push("PROVIDER_ERROR");
    }

    result.timingsMs.total = Math.round(performance.now() - start);
    result.reviewRequired = true;
    const baseQualityScore = calculateQualityScore({
      searchMatch: result.searchSuccess,
      yearMatch: false,
      movieDetail: result.detailSuccess,
      credits: result.creditsSuccess,
      poster: false,
      backdrop: false,
      externalIds: result.externalIdsSuccess,
      normalization: result.normalizationSuccess,
      validation: result.validationSuccess,
      metadataCompleteness: false,
    });
    result.contentQualityScore = applyReviewPenalties(
      baseQualityScore,
      result.reviewReasons,
    );
    result.qualityScore = result.contentQualityScore;
    result.pipelineStatus = getPipelineStatus(result);
    return { result };
  }
}

async function runWithConcurrency(items, worker, limit) {
  const results = new Array(items.length);
  let cursor = 0;

  async function runWorker() {
    while (cursor < items.length) {
      const currentIndex = cursor;
      cursor += 1;
      console.log(`${currentIndex + 1} / ${items.length} ${items[currentIndex].title}`);
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(Array.from({ length: limit }, runWorker));
  return results;
}

function countBy(values) {
  return values.reduce((counts, value) => {
    if (!value) {
      return counts;
    }
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

if (!hasEnvLocal || (!process.env.TMDB_API_KEY && !process.env.TMDB_ACCESS_TOKEN)) {
  console.log("TMDB pilot 100 skipped.");
  console.log(".env.local was found:", hasEnvLocal ? "yes" : "no");
  console.log("Set TMDB_API_KEY or TMDB_ACCESS_TOKEN in .env.local, then run npm run ingest:pilot100.");
  process.exit(0);
}

ensureOutputDirs();

const provider = createTmdbCatalogProviderFromEnv();
const batchStartedAt = new Date().toISOString();
const batchStart = performance.now();
const processed = await runWithConcurrency(
  pilotMovies,
  (movie, index) => processMovie(provider, movie, index),
  concurrency,
);
const batchFinishedAt = new Date().toISOString();

const rows = processed.map((item) => item.result);
const records = processed.map((item) => item.record).filter(Boolean);
const normalizedRecords = processed.map((item) => item.normalized).filter(Boolean);
const canonicalDrafts = processed.map((item) => item.draft).filter(Boolean);

writeJson("raw/external-movie-records.json", records);
writeJson("normalized/normalized-movie-records.json", normalizedRecords);
writeJson("canonical/canonical-movie-drafts.json", canonicalDrafts);

const titleGroups = rows.reduce((groups, row) => {
  const key = row.expectedTitle.toLocaleLowerCase("en-US");
  groups[key] = groups[key] ?? [];
  groups[key].push({
    title: row.expectedTitle,
    year: row.expectedYear,
    providerMovieId: row.providerMovieId,
  });
  return groups;
}, {});

const duplicates = Object.entries(titleGroups)
  .filter(([, group]) => group.length > 1)
  .map(([titleKey, candidates]) => ({
    titleKey,
    classification: classifyDuplicate(titleKey, candidates),
    reason: "same normalized title across multiple expected years",
    candidates,
  }));

const unresolved = rows
  .filter((row) => row.reviewRequired || row.contentQualityScore < catalogReadyThreshold)
  .map((row) => ({
    movie: row.expectedTitle,
    expectedYear: row.expectedYear,
    providerMovieId: row.providerMovieId,
    pipelineStatus: row.pipelineStatus,
    contentQualityScore: row.contentQualityScore,
    reviewRequired: row.reviewRequired,
    reasons: row.reviewReasons,
    mismatches: row.mismatches,
  }));

const qualityReport = rows.map((row) => ({
  movie: row.expectedTitle,
  expectedYear: row.expectedYear,
  providerMovieId: row.providerMovieId,
  pipelineStatus: row.pipelineStatus,
  contentQualityScore: row.contentQualityScore,
  qualityBand: getQualityBand(row.contentQualityScore),
  reviewRequired: row.reviewRequired,
  yearClassification: row.yearClassification,
  issues: row.reviewReasons.filter((reason) => reason.severity === "blocker"),
  warnings: [
    ...row.reviewReasons.filter((reason) => reason.severity === "review"),
    ...row.warnings.map((message) => ({
      code: "VALIDATION_WARNING",
      severity: "review",
      message,
    })),
  ],
  checks: {
    search: row.searchSuccess,
    match: row.matchSuccess,
    detail: row.detailSuccess,
    credits: row.creditsSuccess,
    poster: !row.mismatches.includes("Missing Poster"),
    backdrop: !row.mismatches.includes("Missing Backdrop"),
    externalIds: row.externalIdsSuccess,
    normalization: row.normalizationSuccess,
    validation: row.validationSuccess,
  },
}));

const allCountryIds = canonicalDrafts.flatMap((draft) => draft.countryIds);
const allGenreIds = canonicalDrafts.flatMap((draft) => draft.genreIds);
const allLanguageIds = canonicalDrafts.flatMap((draft) => draft.languageIds);
const totalProcessingTimeMs = Math.round(performance.now() - batchStart);

const statistics = {
  moviesTested: rows.length,
  externalRecords: records.length,
  normalizedRecords: normalizedRecords.length,
  canonicalDrafts: canonicalDrafts.length,
  averagePipelineSuccess: Math.round(
    (rows.filter((row) => row.pipelineStatus !== "FAILED").length / rows.length) * 100,
  ),
  averageContentQuality: Number(
    (rows.reduce((sum, row) => sum + row.contentQualityScore, 0) / rows.length).toFixed(2),
  ),
  averageQualityScore: Number(
    (rows.reduce((sum, row) => sum + row.contentQualityScore, 0) / rows.length).toFixed(2),
  ),
  manualReviewPercent: Math.round((unresolved.length / rows.length) * 100),
  hardMismatchPercent: Math.round(
    (rows.filter((row) => row.yearClassification === "HARD_MISMATCH").length / rows.length) * 100,
  ),
  yearVariantPercent: Math.round(
    (rows.filter((row) => row.yearClassification === "WITHIN_ONE_YEAR").length / rows.length) * 100,
  ),
  posterCoveragePercent: Math.round(
    (rows.filter((row) => !row.mismatches.includes("Missing Poster")).length / rows.length) * 100,
  ),
  backdropCoveragePercent: Math.round(
    (rows.filter((row) => !row.mismatches.includes("Missing Backdrop")).length / rows.length) * 100,
  ),
  missingPosters: rows.filter((row) => row.mismatches.includes("Missing Poster")).length,
  missingBackdrops: rows.filter((row) => row.mismatches.includes("Missing Backdrop")).length,
  missingCredits: rows.filter((row) => row.mismatches.includes("Missing Credits")).length,
  missingImdb: rows.filter((row) => row.mismatches.includes("Missing IMDb")).length,
  duplicateCandidates: duplicates.length,
  unresolved: unresolved.length,
  qualityDistribution: rows.reduce((distribution, row) => {
    const band = getQualityBand(row.contentQualityScore);
    distribution[band] = (distribution[band] ?? 0) + 1;
    return distribution;
  }, {}),
  pipelineStatusDistribution: countBy(rows.map((row) => row.pipelineStatus)),
  manualReviewReasonDistribution: countBy(
    rows.flatMap((row) => row.reviewReasons.map((reason) => reason.code)),
  ),
  yearClassificationDistribution: countBy(rows.map((row) => row.yearClassification)),
  countryDistribution: countBy(allCountryIds),
  genreDistribution: countBy(allGenreIds),
  languageDistribution: countBy(allLanguageIds),
  performance: {
    totalProcessingTimeMs,
    averageMovieProcessingTimeMs: Math.round(
      rows.reduce((sum, row) => sum + row.timingsMs.total, 0) / rows.length,
    ),
    averageTmdbSearchTimeMs: Math.round(
      rows.reduce((sum, row) => sum + row.timingsMs.search, 0) / rows.length,
    ),
    averageTmdbDetailTimeMs: Math.round(
      rows.reduce((sum, row) => sum + row.timingsMs.detail, 0) / rows.length,
    ),
    averageNormalizationTimeMs: Math.round(
      rows.reduce((sum, row) => sum + row.timingsMs.normalization, 0) / rows.length,
    ),
    averageValidationTimeMs: Math.round(
      rows.reduce((sum, row) => sum + row.timingsMs.validation, 0) / rows.length,
    ),
  },
};

const summary = {
  batch: "tmdb-pilot-100",
  startedAt: batchStartedAt,
  finishedAt: batchFinishedAt,
  concurrency,
  provider: "tmdb",
  ...statistics,
};

writeJson("reports/summary.json", summary);
writeJson("reports/quality-report.json", qualityReport);
writeJson("reports/duplicates.json", duplicates);
writeJson("reports/unresolved.json", unresolved);
writeJson("reports/statistics.json", statistics);

console.log("");
console.log("TMDB Pilot 100 Summary");
console.table([
  {
    Movies: rows.length,
    "Pipeline %": statistics.averagePipelineSuccess,
    "Avg Content": statistics.averageContentQuality,
    Unresolved: unresolved.length,
    Duplicates: duplicates.length,
    "Missing Poster": statistics.missingPosters,
    "Missing Backdrop": statistics.missingBackdrops,
    "Missing Credits": statistics.missingCredits,
    "Missing IMDb": statistics.missingImdb,
    "Total ms": statistics.performance.totalProcessingTimeMs,
  },
]);
console.log(`Reports written to ${outputRoot}`);

const fatalFailures = rows.filter(
  (row) =>
    !row.searchSuccess ||
    !row.detailSuccess ||
    !row.normalizationSuccess ||
    !row.validationSuccess,
);

if (fatalFailures.length > 0) {
  process.exitCode = 1;
}
