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

const envLocalPath = path.join(rootDir, ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envLines = fs.readFileSync(envLocalPath, "utf8").split(/\r?\n/);
  for (const line of envLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    process.env[key] ??= valueParts.join("=").replace(/^['"]|['"]$/g, "");
  }
}

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

const { catalogImportPipeline } = requireFromScript("../lib/catalogImport.ts");
const { createTmdbCatalogProviderFromEnv } = requireFromScript(
  "../lib/catalog/providers/TmdbCatalogProvider.ts",
);

const pilotMovies = [
  "Parasite",
  "Seven Samurai",
  "The Godfather",
  "Spirited Away",
  "In the Mood for Love",
  "Oldboy",
  "Pulp Fiction",
  "Roma",
  "City of God",
  "The Seventh Seal",
];

if (!process.env.TMDB_API_KEY && !process.env.TMDB_ACCESS_TOKEN) {
  console.log("TMDB pilot skipped: set TMDB_API_KEY or TMDB_ACCESS_TOKEN in .env.local.");
  process.exit(0);
}

const provider = createTmdbCatalogProviderFromEnv();
const records = [];

for (const title of pilotMovies) {
  const searchResults = await provider.searchMovie({ query: title });
  const firstResult = searchResults[0];

  if (!firstResult) {
    console.log(`[MISS] ${title}: no TMDB search result`);
    continue;
  }

  const record = await provider.getMovieDetails(firstResult.providerMovieId);
  records.push(record);
  console.log(
    `[OK] ${title}: ${record.metadata.title ?? "Untitled"} (${record.externalIds.tmdbId})`,
  );
}

const normalized = catalogImportPipeline.normalizeExternalMovies(records);
console.log("");
console.log(`External records: ${records.length}`);
console.log(`Normalized records: ${normalized.records.length}`);
console.log(`Issues: ${normalized.issues.length}`);

if (normalized.issues.some((issue) => issue.severity === "error")) {
  process.exitCode = 1;
}
