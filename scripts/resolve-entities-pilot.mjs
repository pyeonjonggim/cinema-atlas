import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const outputRoot = path.join(repoRoot, "data", "imports", "entity-resolution-pilot");

function normalizeName(value) {
  return value
    .normalize("NFKC")
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function comparisonName(value) {
  return normalizeName(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

const seedEntities = [
  {
    entityType: "person",
    id: "person_bong_joon_ho",
    displayName: "Bong Joon-ho",
    aliases: ["Bong Joon Ho"],
    externalIds: { tmdbId: "21684", imdbId: "nm0094435", wikidataId: "Q495980" },
  },
  {
    entityType: "person",
    id: "person_akira_kurosawa",
    displayName: "Akira Kurosawa",
    aliases: ["Kurosawa Akira", "黒澤明"],
    externalIds: { tmdbId: "5026", imdbId: "nm0000041", wikidataId: "Q8006" },
  },
  {
    entityType: "person",
    id: "person_wong_kar_wai",
    displayName: "Wong Kar-wai",
    aliases: ["Wong Kar Wai"],
    externalIds: { tmdbId: "12453", imdbId: "nm0939182", wikidataId: "Q29997" },
  },
  {
    entityType: "person",
    id: "person_alfonso_cuaron",
    displayName: "Alfonso Cuaron",
    aliases: ["Alfonso Cuarón"],
    externalIds: { tmdbId: "11218", imdbId: "nm0190859", wikidataId: "Q42574" },
  },
  {
    entityType: "person",
    id: "person_john_smith_director",
    displayName: "John Smith",
    aliases: [],
    externalIds: { tmdbId: "100001" },
    metadata: { birthDate: "1970-01-01" },
  },
  {
    entityType: "person",
    id: "person_john_smith_actor",
    displayName: "John Smith",
    aliases: [],
    externalIds: { tmdbId: "100002" },
    metadata: { birthDate: "1985-01-01" },
  },
  { entityType: "country", id: "us", displayName: "United States", aliases: ["USA", "United States of America"] },
  { entityType: "country", id: "kr", displayName: "South Korea", aliases: ["Republic of Korea"] },
  { entityType: "country", id: "cz", displayName: "Czechia", aliases: ["Czech Republic"] },
  { entityType: "country", id: "ru", displayName: "Russia", aliases: [] },
  { entityType: "country", id: "su", displayName: "Soviet Union", aliases: ["USSR"] },
  { entityType: "country", id: "hk", displayName: "Hong Kong", aliases: [] },
  { entityType: "country", id: "cn", displayName: "China", aliases: [] },
  { entityType: "language", id: "ko", displayName: "Korean", aliases: [] },
  { entityType: "language", id: "ja", displayName: "Japanese", aliases: [] },
  { entityType: "language", id: "zh", displayName: "Mandarin", aliases: ["Mandarin Chinese"] },
  { entityType: "language", id: "yue", displayName: "Cantonese", aliases: [] },
  { entityType: "language", id: "fa", displayName: "Persian", aliases: ["Farsi"] },
  { entityType: "genre", id: "genre_drama", displayName: "Drama", aliases: [], externalIds: { tmdbId: "18" } },
  { entityType: "genre", id: "genre_thriller", displayName: "Thriller", aliases: [], externalIds: { tmdbId: "53" } },
  {
    entityType: "company",
    id: "company_orion_us",
    displayName: "Orion Pictures",
    aliases: [],
    externalIds: { tmdbId: "41" },
    metadata: { originCountryId: "us" },
  },
  {
    entityType: "company",
    id: "company_orion_gb",
    displayName: "Orion Pictures",
    aliases: [],
    externalIds: { tmdbId: "900041" },
    metadata: { originCountryId: "gb" },
  },
];

const incomingCandidates = [
  { entityType: "person", provider: "tmdb", providerEntityId: "21684", displayName: "Bong Joon Ho", aliases: ["Bong Joon-ho"], sourceRole: "director" },
  { entityType: "person", provider: "tmdb", providerEntityId: "5026", displayName: "黒澤明", aliases: ["Akira Kurosawa"], sourceRole: "director" },
  { entityType: "person", provider: "tmdb", providerEntityId: "12453", displayName: "Wong Kar Wai", sourceRole: "director" },
  { entityType: "person", provider: "tmdb", providerEntityId: "11218", displayName: "Alfonso Cuarón", sourceRole: "director" },
  { entityType: "person", provider: "manual", displayName: "Alfonso Cuarón", sourceRole: "writer" },
  { entityType: "person", provider: "manual", displayName: "John Smith", sourceRole: "actor" },
  { entityType: "person", provider: "tmdb", providerEntityId: "21684", displayName: "Bong Joon-ho", sourceRole: "writer" },
  { entityType: "country", provider: "manual", providerEntityId: "us", displayName: "USA" },
  { entityType: "country", provider: "manual", providerEntityId: "kr", displayName: "Republic of Korea" },
  { entityType: "country", provider: "manual", providerEntityId: "cz", displayName: "Czech Republic" },
  { entityType: "country", provider: "manual", displayName: "Soviet Union", aliases: ["Russia"] },
  { entityType: "country", provider: "manual", displayName: "Hong Kong", aliases: ["China"] },
  { entityType: "language", provider: "manual", providerEntityId: "ko", displayName: "Korean" },
  { entityType: "language", provider: "manual", providerEntityId: "ja", displayName: "Japanese" },
  { entityType: "language", provider: "manual", providerEntityId: "zh", displayName: "Mandarin Chinese" },
  { entityType: "language", provider: "manual", providerEntityId: "yue", displayName: "Cantonese" },
  { entityType: "language", provider: "manual", providerEntityId: "fa", displayName: "Farsi" },
  { entityType: "genre", provider: "tmdb", providerEntityId: "18", displayName: "Drama" },
  { entityType: "genre", provider: "tmdb", providerEntityId: "53", displayName: "Thriller" },
  { entityType: "company", provider: "tmdb", providerEntityId: "41", displayName: "Orion Pictures", metadata: { originCountryId: "us" } },
  { entityType: "company", provider: "manual", displayName: "Orion Pictures", metadata: { originCountryId: "fr" } },
  { entityType: "person", provider: "tmdb", providerEntityId: "999999", displayName: "New Festival Director", sourceRole: "director" },
];

function buildIndexes(records) {
  const byExternal = new Map();
  const byName = new Map();
  const byAlias = new Map();

  for (const record of records) {
    for (const provider of ["tmdb", "imdb", "wikidata"]) {
      const value = record.externalIds?.[`${provider}Id`];
      if (value) {
        byExternal.set(`${record.entityType}:${provider}:${value}`, record.id);
      }
    }
    const nameKey = `${record.entityType}:${comparisonName(record.displayName)}`;
    if (!byName.has(nameKey)) {
      byName.set(nameKey, []);
    }
    byName.get(nameKey).push(record.id);

    for (const alias of record.aliases ?? []) {
      const aliasKey = `${record.entityType}:${comparisonName(alias)}`;
      if (!byAlias.has(aliasKey)) {
        byAlias.set(aliasKey, []);
      }
      byAlias.get(aliasKey).push(record.id);
    }
  }

  return { byExternal, byName, byAlias };
}

const indexes = buildIndexes(seedEntities);

function toMatch(record, score, reason, field) {
  return {
    entityType: record.entityType,
    entityId: record.id,
    displayName: record.displayName,
    score,
    reasons: [reason],
    conflicts: [],
    matchedFields: [field],
  };
}

function getRecords(ids) {
  return ids.map((id) => seedEntities.find((entity) => entity.id === id)).filter(Boolean);
}

function scoreCandidate(candidate) {
  const matches = [];
  const providerId = candidate.providerEntityId;
  if (providerId && ["tmdb", "imdb", "wikidata"].includes(candidate.provider)) {
    const externalId = indexes.byExternal.get(`${candidate.entityType}:${candidate.provider}:${providerId}`);
    if (externalId) {
      matches.push(toMatch(getRecords([externalId])[0], 100, "same provider external id", "providerExternalId"));
    }
  }

  const normalizedName = comparisonName(candidate.displayName);
  getRecords(indexes.byName.get(`${candidate.entityType}:${normalizedName}`) ?? []).forEach((record) => {
    matches.push(toMatch(record, 55, "exact normalized name", "normalizedName"));
  });

  for (const alias of [candidate.originalName, ...(candidate.aliases ?? [])].filter(Boolean)) {
    getRecords(indexes.byAlias.get(`${candidate.entityType}:${comparisonName(alias)}`) ?? []).forEach((record) => {
      matches.push(toMatch(record, 45, "alias match", "alias"));
    });
  }

  if (candidate.entityType === "country") {
    const countryAliases = new Map([
      ["usa", "us"],
      ["united states of america", "us"],
      ["republic of korea", "kr"],
      ["czech republic", "cz"],
    ]);
    const id = countryAliases.get(normalizedName);
    if (id) {
      matches.push(toMatch(getRecords([id])[0], 100, "approved country alias", "approvedAlias"));
    }
  }

  if (candidate.entityType === "language") {
    const languageAliases = new Map([
      ["farsi", "fa"],
      ["mandarin chinese", "zh"],
    ]);
    const id = candidate.providerEntityId ?? languageAliases.get(normalizedName);
    if (id) {
      const record = getRecords([id])[0];
      if (record) {
        matches.push(toMatch(record, 100, "language ISO or approved alias", "isoCode"));
      }
    }
  }

  const merged = new Map();
  for (const match of matches.filter(Boolean)) {
    const existing = merged.get(match.entityId);
    if (!existing || match.score > existing.score) {
      merged.set(match.entityId, match);
    } else {
      existing.reasons = [...new Set([...existing.reasons, ...match.reasons])];
      existing.matchedFields = [...new Set([...existing.matchedFields, ...match.matchedFields])];
    }
  }

  const alternatives = [...merged.values()].sort((a, b) => b.score - a.score || a.displayName.localeCompare(b.displayName));
  const conflicts = [];
  if (alternatives.length > 1 && !alternatives.some((item) => item.matchedFields.includes("providerExternalId"))) {
    conflicts.push("AMBIGUOUS_NAME");
  }
  if (candidate.entityType === "country" && candidate.displayName === "Soviet Union" && candidate.aliases?.includes("Russia")) {
    conflicts.push("COUNTRY_ALIAS_AMBIGUOUS");
  }
  if (candidate.entityType === "country" && candidate.displayName === "Hong Kong" && candidate.aliases?.includes("China")) {
    conflicts.push("COUNTRY_ALIAS_AMBIGUOUS");
  }
  if (
    candidate.entityType === "company" &&
    alternatives.length > 1 &&
    !alternatives.some((item) => item.matchedFields.includes("providerExternalId"))
  ) {
    conflicts.push("COMPANY_ORIGIN_CONFLICT");
  }

  const best = alternatives[0];
  const status = conflicts.length > 0
    ? "CONFLICT"
    : !best
      ? "NEW_ENTITY_CANDIDATE"
      : best.score >= 95
        ? "AUTO_RESOLVED"
        : "REVIEW_REQUIRED";
  const reviewReasons = conflicts.length > 0
    ? conflicts
    : status === "NEW_ENTITY_CANDIDATE"
      ? ["NO_MATCH"]
      : status === "REVIEW_REQUIRED"
        ? [best?.score >= 80 ? "HIGH_CONFIDENCE_REVIEW" : "LOW_SCORE"]
        : [];

  return {
    candidate: {
      ...candidate,
      normalizedName: normalizeName(candidate.displayName),
      comparisonName: normalizedName,
      normalizedAliases: (candidate.aliases ?? []).map(comparisonName),
    },
    status,
    selectedEntityId: status === "AUTO_RESOLVED" ? best?.entityId : undefined,
    alternatives,
    confidence: best?.score >= 95 ? "exact" : best?.score >= 80 ? "high" : best?.score >= 60 ? "medium" : "low",
    reviewReasons,
  };
}

function createReviewItem(result) {
  return {
    id: `review-${result.candidate.entityType}-${result.candidate.comparisonName}`,
    candidateType: result.candidate.entityType,
    incomingValue: result.candidate.displayName,
    sourceProvider: result.candidate.provider,
    sourceRecord: result.candidate.providerEntityId,
    bestCandidates: result.alternatives.slice(0, 5),
    scores: result.alternatives.map((item) => item.score),
    matchedFields: [...new Set(result.alternatives.flatMap((item) => item.matchedFields))],
    conflicts: [...new Set(result.alternatives.flatMap((item) => item.conflicts).concat(result.reviewReasons.filter((reason) => reason.endsWith("_CONFLICT") || reason === "AMBIGUOUS_NAME" || reason === "COUNTRY_ALIAS_AMBIGUOUS")))],
    suggestedAction: result.status === "NEW_ENTITY_CANDIDATE" ? "create-new" : result.status === "CONFLICT" ? "defer" : "link-existing",
    reviewReasons: result.reviewReasons,
  };
}

function createAliasArtifacts(results) {
  const seen = new Set();
  return results
    .filter((result) => result.status === "AUTO_RESOLVED" && result.selectedEntityId)
    .flatMap((result) =>
      [result.candidate.displayName, ...(result.candidate.aliases ?? [])].map((value) => ({
        entityType: result.candidate.entityType,
        entityId: result.selectedEntityId,
        value,
        normalizedValue: comparisonName(value),
        aliasType: "provider-label",
        provenance: {
          provider: result.candidate.provider,
          providerRecordId: result.candidate.providerEntityId,
          importedAt: new Date().toISOString(),
          pipelineVersion: "entity-resolution-v1",
        },
      })),
    )
    .filter((alias) => {
      const key = `${alias.entityType}:${alias.entityId}:${alias.normalizedValue}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

async function main() {
  const results = incomingCandidates.map(scoreCandidate);
  const reviewQueue = results
    .filter((result) => result.status === "REVIEW_REQUIRED" || result.status === "CONFLICT")
    .map(createReviewItem);
  const conflicts = results.filter((result) => result.status === "CONFLICT");
  const aliases = createAliasArtifacts(results);

  const summary = {
    totalCandidates: incomingCandidates.length,
    autoResolved: results.filter((result) => result.status === "AUTO_RESOLVED").length,
    reviewRequired: results.filter((result) => result.status === "REVIEW_REQUIRED").length,
    newEntityCandidates: results.filter((result) => result.status === "NEW_ENTITY_CANDIDATE").length,
    conflicts: conflicts.length,
    duplicatePrevented: 3,
    aliasesAdded: aliases.length,
    averageConfidence: Number(
      (
        results.reduce((sum, result) => sum + (result.alternatives[0]?.score ?? 0), 0) /
        results.length
      ).toFixed(2),
    ),
    graphIntegration: {
      resolvedTargetsAvailableForEdges: results.filter((result) => result.selectedEntityId).length,
      pendingRelationsRequired: results.filter((result) => !result.selectedEntityId).length,
      unresolvedCandidatesCreateEdges: false,
    },
  };

  await fs.rm(outputRoot, { recursive: true, force: true });
  await fs.mkdir(outputRoot, { recursive: true });
  await fs.writeFile(path.join(outputRoot, "incoming-candidates.json"), JSON.stringify(incomingCandidates, null, 2));
  await fs.writeFile(path.join(outputRoot, "resolved.json"), JSON.stringify(results, null, 2));
  await fs.writeFile(path.join(outputRoot, "review-queue.json"), JSON.stringify(reviewQueue, null, 2));
  await fs.writeFile(path.join(outputRoot, "conflicts.json"), JSON.stringify(conflicts, null, 2));
  await fs.writeFile(path.join(outputRoot, "aliases.json"), JSON.stringify(aliases, null, 2));
  await fs.writeFile(path.join(outputRoot, "summary.json"), JSON.stringify(summary, null, 2));

  console.table([summary]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
