import fs from "node:fs";
import Module from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const requireFromScript = Module.createRequire(import.meta.url);
const originalResolveFilename = Module._resolveFilename;

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
  validateCanonicalMovieDraft,
} = requireFromScript("../lib/catalogImport.ts");
const { createTmdbCatalogProviderFromEnv } = requireFromScript(
  "../lib/catalog/providers/TmdbCatalogProvider.ts",
);

const pilotMovies = [
  { title: "Parasite", year: 2019 },
  { title: "Seven Samurai", year: 1954 },
  { title: "Spirited Away", year: 2001 },
  { title: "Oldboy", year: 2003 },
  { title: "The Godfather", year: 1972 },
  { title: "Pulp Fiction", year: 1994 },
  { title: "In the Mood for Love", year: 2000 },
  { title: "Roma", year: 2018 },
  { title: "City of God", year: 2002 },
  { title: "The Seventh Seal", year: 1957 },
];

function ok(value) {
  return value ? "ok" : "missing";
}

function hasProviderError(error) {
  return Boolean(error?.catalogError);
}

function chooseBestSearchResult(results, expectedYear) {
  return (
    results.find((result) => result.releaseYear === expectedYear) ??
    results[0]
  );
}

if (!hasEnvLocal || (!process.env.TMDB_API_KEY && !process.env.TMDB_ACCESS_TOKEN)) {
  console.log("TMDB pilot skipped.");
  console.log(".env.local was found:", hasEnvLocal ? "yes" : "no");
  console.log("Set TMDB_API_KEY or TMDB_ACCESS_TOKEN in .env.local, then run npm run pilot:tmdb.");
  process.exit(0);
}

const provider = createTmdbCatalogProviderFromEnv();
const rows = [];
const mismatchRows = [];
const records = [];

for (const pilotMovie of pilotMovies) {
  const row = {
    Movie: `${pilotMovie.title} (${pilotMovie.year})`,
    Search: "missing",
    Match: "missing",
    Detail: "missing",
    Credits: "missing",
    "External IDs": "missing",
    Normalization: "missing",
    Validation: "missing",
  };

  try {
    const searchResults = await provider.searchMovie({
      query: pilotMovie.title,
      year: pilotMovie.year,
    });
    const selected = chooseBestSearchResult(searchResults, pilotMovie.year);
    row.Search = searchResults.length > 0 ? "ok" : "missing";
    row.Match =
      selected?.releaseYear === pilotMovie.year
        ? `ok:${selected.providerMovieId}`
        : `check:${selected?.providerMovieId ?? "none"}`;

    if (!selected) {
      mismatchRows.push({
        Movie: pilotMovie.title,
        Issue: "No search result",
      });
      rows.push(row);
      continue;
    }

    if (selected.releaseYear !== pilotMovie.year) {
      mismatchRows.push({
        Movie: pilotMovie.title,
        Issue: `Expected ${pilotMovie.year}, got ${selected.releaseYear ?? "unknown"}`,
      });
    }

    const record = await provider.getMovieDetails(selected.providerMovieId);
    records.push(record);
    row.Detail = ok(
      record.metadata.title &&
        record.metadata.originalTitle &&
        record.metadata.releaseDate &&
        record.metadata.runtime &&
        record.metadata.overview,
    );
    row.Credits = ok(
      record.credits?.some((credit) => credit.role === "director") &&
        record.credits?.some((credit) => credit.role === "actor"),
    );
    row["External IDs"] = ok(record.externalIds.tmdbId && record.externalIds.imdbId);

    const normalized = catalogImportPipeline.normalizeExternalMovies([record]);
    row.Normalization =
      normalized.records.length === 1 && normalized.issues.every((issue) => issue.severity !== "error")
        ? "ok"
        : "error";

    const draft = externalMovieToCanonicalDraft(record);
    const validationIssues = validateCanonicalMovieDraft(draft);
    const errors = validationIssues.filter((issue) => issue.severity === "error");
    const warnings = validationIssues.filter((issue) => issue.severity === "warning");
    row.Validation = errors.length === 0 ? (warnings.length ? `ok:${warnings.length}w` : "ok") : "error";

    const missing = [
      !record.metadata.runtime ? "runtime" : undefined,
      !record.metadata.backdrop?.path ? "backdrop" : undefined,
      !record.metadata.poster?.path ? "poster" : undefined,
      !record.credits?.length ? "credits" : undefined,
      !record.externalIds.imdbId ? "imdbId" : undefined,
      draft && draft.countryIds.length === 0 ? "countries" : undefined,
      draft && draft.languageIds.length === 0 ? "languages" : undefined,
    ].filter(Boolean);

    if (missing.length > 0 || warnings.length > 0 || errors.length > 0) {
      mismatchRows.push({
        Movie: pilotMovie.title,
        Issue: [...missing, ...validationIssues.map((issue) => `${issue.severity}:${issue.field}`)].join(", "),
      });
    }
  } catch (error) {
    if (hasProviderError(error)) {
      row.Search = `provider:${error.catalogError.code}`;
      mismatchRows.push({
        Movie: pilotMovie.title,
        Issue: `${error.catalogError.code}: ${error.catalogError.message}`,
      });
    } else {
      row.Search = "error";
      mismatchRows.push({
        Movie: pilotMovie.title,
        Issue: error?.message ?? "Unknown error",
      });
    }
  }

  rows.push(row);
}

const normalized = catalogImportPipeline.normalizeExternalMovies(records);

console.log("TMDB Live Pilot Summary");
console.table(rows);
console.log("");
console.log("Mismatch Report");
if (mismatchRows.length === 0) {
  console.log("No mismatches detected.");
} else {
  console.table(mismatchRows);
}
console.log("");
console.log(`External records: ${records.length}`);
console.log(`Normalized records: ${normalized.records.length}`);
console.log(`Normalizer issues: ${normalized.issues.length}`);

const failed = rows.some((row) =>
  [row.Search, row.Detail, row.Credits, row.Normalization, row.Validation].some((value) =>
    String(value).startsWith("error") || String(value).startsWith("provider:"),
  ),
);

if (failed) {
  process.exitCode = 1;
}

