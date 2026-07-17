import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const expectedCountries = {
  br: { displayName: "Brazil", slug: "brazil" },
  de: { displayName: "Germany", slug: "germany" },
  fr: { displayName: "France", slug: "france" },
  jp: { displayName: "Japan", slug: "japan" },
  us: { displayName: "United States", slug: "united-states" },
  kr: { displayName: "South Korea", slug: "korea" },
  cn: { displayName: "China", slug: "china" },
  hk: { displayName: "Hong Kong", slug: "hong-kong" },
  tw: { displayName: "Taiwan", slug: "taiwan" },
  gb: { displayName: "United Kingdom", slug: "united-kingdom" },
};

function loadEnvLocal() {
  const envPath = path.resolve(".env.local");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function assertSourceProjection() {
  const source = fs.readFileSync(path.resolve("lib/catalogQuery.ts"), "utf8");
  const failures = [];

  for (const [iso, expected] of Object.entries(expectedCountries)) {
    if (!source.includes(`${iso}: {`)) failures.push(`${iso}: missing editorial projection`);
    if (!source.includes(`displayName: "${expected.displayName}"`)) failures.push(`${iso}: missing ${expected.displayName} displayName`);
    if (!source.includes(`slug: "${expected.slug}"`)) failures.push(`${iso}: missing ${expected.slug} slug`);
  }

  if (source.includes("countryFlag: countryId.toUpperCase()")) {
    failures.push("Movie countryFlag still exposes ISO code directly");
  }

  return failures;
}

function assertEnglishUiSource() {
  const roots = ["app", "components", "lib"];
  const hangulPattern = /[가-힣]/;
  const encodedPatterns = [/\?렏|\?뙇|\?뱴|\?렚|\?룇|\?빖|\?㎛/, /곹솕|媛먮룆|諛곗슦|援\?\?|먮쫫/];
  const failures = [];

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (!/\.(ts|tsx)$/.test(entry.name)) continue;
      const content = fs.readFileSync(fullPath, "utf8");
      if (hangulPattern.test(content) || encodedPatterns.some((pattern) => pattern.test(content))) {
        failures.push(fullPath);
      }
    }
  }

  roots.forEach(walk);
  return failures;
}

async function readAvailableDbCountries() {
  loadEnvLocal();
  if (!process.env.DATABASE_URL) return [];

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const ids = Object.keys(expectedCountries);
    const result = await client.query(
      "select id, iso_code, display_name from catalog_countries where lower(id) = any($1) order by id",
      [ids],
    );
    return result.rows.map((row) => {
      const id = String(row.id).toLowerCase();
      return {
        id,
        rawDisplayName: row.display_name,
        normalizedDisplayName: expectedCountries[id]?.displayName ?? row.display_name,
        isoCode: row.iso_code,
      };
    });
  } finally {
    await client.end();
  }
}

const projectionFailures = assertSourceProjection();
const uiFailures = assertEnglishUiSource();
const dbCountries = await readAvailableDbCountries();

const summary = {
  expectedCountries,
  dbCountries,
  projectionFailures,
  uiSourceFailures: uiFailures,
  status: projectionFailures.length === 0 && uiFailures.length === 0 ? "PASS" : "FAIL",
};

fs.mkdirSync(path.resolve("data/imports/country-normalization-patch"), { recursive: true });
fs.writeFileSync(
  path.resolve("data/imports/country-normalization-patch/summary.json"),
  `${JSON.stringify(summary, null, 2)}\n`,
);

console.log(`Country normalization: ${summary.status}`);
console.log(`Expected country projections: ${Object.keys(expectedCountries).length}`);
console.log(`DB country samples found: ${dbCountries.length}`);
for (const row of dbCountries) {
  console.log(`- ${row.id.toUpperCase()}: raw=${row.rawDisplayName} normalized=${row.normalizedDisplayName}`);
}

if (projectionFailures.length > 0) {
  console.error("Projection failures:");
  projectionFailures.forEach((failure) => console.error(`- ${failure}`));
}

if (uiFailures.length > 0) {
  console.error("UI source failures:");
  uiFailures.forEach((failure) => console.error(`- ${failure}`));
}

if (summary.status !== "PASS") process.exit(1);
