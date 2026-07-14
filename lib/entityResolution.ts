import type {
  EntityMatchCandidate,
  EntityResolutionConflictCode,
  EntityResolutionRepository,
  EntityResolutionResult,
  EntityResolutionReviewReason,
  EntityResolutionStatus,
  EntityReviewQueueItem,
  ExternalCompanyCandidate,
  ExternalCountryCandidate,
  ExternalEntityCandidate,
  ExternalGenreCandidate,
  ExternalLanguageCandidate,
  ExternalPersonCandidate,
  NormalizedEntityCandidate,
  ResolvableEntityType,
} from "@/types/entityResolution";

export function normalizeEntityName(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeComparisonName(value: string): string {
  return normalizeEntityName(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

const countryAliases = new Map<string, string>([
  ["usa", "us"],
  ["u s a", "us"],
  ["united states", "us"],
  ["united states of america", "us"],
  ["south korea", "kr"],
  ["republic of korea", "kr"],
  ["korea republic of", "kr"],
  ["czechia", "cz"],
  ["czech republic", "cz"],
]);

const languageAliases = new Map<string, string>([
  ["farsi", "fa"],
  ["persian", "fa"],
  ["mandarin", "zh"],
  ["mandarin chinese", "zh"],
  ["cantonese", "yue"],
  ["korean", "ko"],
  ["japanese", "ja"],
]);

export function normalizeEntityCandidate(
  candidate: ExternalEntityCandidate,
): NormalizedEntityCandidate {
  const normalizedName = normalizeEntityName(candidate.displayName);
  const comparisonName = normalizeComparisonName(candidate.displayName);
  const normalizedAliases = [
    ...(candidate.aliases ?? []),
    candidate.originalName,
  ]
    .filter((alias): alias is string => Boolean(alias))
    .map(normalizeComparisonName);

  if (candidate.entityType === "country") {
    const country = candidate as ExternalCountryCandidate;
    const aliasId = countryAliases.get(comparisonName);
    return {
      ...candidate,
      providerEntityId: country.isoCode?.toLowerCase() ?? aliasId ?? candidate.providerEntityId,
      normalizedName,
      comparisonName,
      normalizedAliases,
    };
  }

  if (candidate.entityType === "language") {
    const language = candidate as ExternalLanguageCandidate;
    const aliasId = languageAliases.get(comparisonName);
    return {
      ...candidate,
      providerEntityId:
        language.iso6391?.toLowerCase() ??
        language.iso6392?.toLowerCase() ??
        aliasId ??
        candidate.providerEntityId,
      normalizedName,
      comparisonName,
      normalizedAliases,
    };
  }

  return {
    ...candidate,
    normalizedName,
    comparisonName,
    normalizedAliases,
  };
}

function scoreToConfidence(score: number): "exact" | "high" | "medium" | "low" {
  if (score >= 95) {
    return "exact";
  }
  if (score >= 80) {
    return "high";
  }
  if (score >= 60) {
    return "medium";
  }
  return "low";
}

function statusFromBestCandidate(
  best: EntityMatchCandidate | undefined,
  conflicts: EntityResolutionConflictCode[],
): EntityResolutionStatus {
  if (conflicts.length > 0) {
    return "CONFLICT";
  }
  if (!best) {
    return "NEW_ENTITY_CANDIDATE";
  }
  if (best.score >= 95) {
    return "AUTO_RESOLVED";
  }
  return "REVIEW_REQUIRED";
}

function reviewReasonsFromStatus(
  status: EntityResolutionStatus,
  best: EntityMatchCandidate | undefined,
  conflicts: EntityResolutionConflictCode[],
): EntityResolutionReviewReason[] {
  if (conflicts.length > 0) {
    return conflicts;
  }
  if (status === "NEW_ENTITY_CANDIDATE") {
    return ["NO_MATCH"];
  }
  if (!best) {
    return ["NO_MATCH"];
  }
  if (best.score >= 80 && best.score < 95) {
    return ["HIGH_CONFIDENCE_REVIEW"];
  }
  if (best.matchedFields.length === 1 && best.matchedFields.includes("alias")) {
    return ["ALIAS_ONLY_MATCH"];
  }
  return best.score < 80 ? ["LOW_SCORE"] : [];
}

function getProviderId(candidate: NormalizedEntityCandidate): string | undefined {
  if (candidate.providerEntityId) {
    return String(candidate.providerEntityId);
  }

  if (candidate.entityType === "genre") {
    return (candidate as ExternalGenreCandidate).providerGenreId;
  }

  return undefined;
}

function detectConflicts(
  candidate: NormalizedEntityCandidate,
  alternatives: EntityMatchCandidate[],
): EntityResolutionConflictCode[] {
  const conflicts = new Set<EntityResolutionConflictCode>();
  const hasExactExternalMatch = alternatives.some((item) =>
    item.matchedFields.some((field) => field.includes("external")),
  );

  if (alternatives.length > 1 && !hasExactExternalMatch) {
    conflicts.add("AMBIGUOUS_NAME");
  }

  if (candidate.entityType === "company" && alternatives.length > 0) {
    const company = candidate as ExternalCompanyCandidate;
    if (company.originCountryId && alternatives.some((item) => item.conflicts.includes("COMPANY_ORIGIN_CONFLICT"))) {
      conflicts.add("COMPANY_ORIGIN_CONFLICT");
    }
  }

  return [...conflicts];
}

function mergeCandidateScores(candidates: EntityMatchCandidate[]): EntityMatchCandidate[] {
  const merged = new Map<string, EntityMatchCandidate>();

  candidates.forEach((candidate) => {
    const key = `${candidate.entityType}:${candidate.entityId}`;
    const existing = merged.get(key);
    if (!existing || candidate.score > existing.score) {
      merged.set(key, candidate);
      return;
    }

    existing.score = Math.max(existing.score, candidate.score);
    existing.reasons = [...new Set([...existing.reasons, ...candidate.reasons])];
    existing.matchedFields = [...new Set([...existing.matchedFields, ...candidate.matchedFields])];
    existing.conflicts = [...new Set([...existing.conflicts, ...candidate.conflicts])];
  });

  return [...merged.values()].sort((a, b) => b.score - a.score || a.displayName.localeCompare(b.displayName));
}

export class EntityResolutionService {
  constructor(private readonly repository: EntityResolutionRepository) {}

  async resolvePerson(candidate: ExternalPersonCandidate): Promise<EntityResolutionResult> {
    return this.resolve(candidate);
  }

  async resolveCountry(candidate: ExternalCountryCandidate): Promise<EntityResolutionResult> {
    return this.resolve(candidate);
  }

  async resolveLanguage(candidate: ExternalLanguageCandidate): Promise<EntityResolutionResult> {
    return this.resolve(candidate);
  }

  async resolveGenre(candidate: ExternalGenreCandidate): Promise<EntityResolutionResult> {
    return this.resolve(candidate);
  }

  async resolveCompany(candidate: ExternalCompanyCandidate): Promise<EntityResolutionResult> {
    return this.resolve(candidate);
  }

  async resolveBatch(candidates: ExternalEntityCandidate[]): Promise<EntityResolutionResult[]> {
    const results: EntityResolutionResult[] = [];
    for (const candidate of candidates) {
      results.push(await this.resolve(candidate));
    }
    return results;
  }

  async findCandidates(candidate: ExternalEntityCandidate): Promise<EntityMatchCandidate[]> {
    const normalized = normalizeEntityCandidate(candidate);
    const matches: EntityMatchCandidate[] = [];
    const providerId = getProviderId(normalized);

    if (providerId && ["tmdb", "imdb", "wikidata"].includes(normalized.provider)) {
      const external = await this.repository.getEntityByExternalId(
        normalized.entityType,
        normalized.provider as "tmdb" | "imdb" | "wikidata",
        providerId,
      );
      if (external && typeof external === "object" && "id" in external) {
        matches.push({
          entityType: normalized.entityType,
          entityId: String(external.id),
          displayName:
            "name" in external && typeof external.name === "string"
              ? external.name
              : normalized.displayName,
          score: 100,
          confidence: "exact",
          reasons: ["same provider external id"],
          conflicts: [],
          matchedFields: ["providerExternalId"],
        });
      }
    }

    for (const provider of ["imdb", "wikidata"] as const) {
      const value = normalized.externalIds?.[provider === "imdb" ? "imdbId" : "wikidataId"];
      if (!value) {
        continue;
      }
      const external = await this.repository.getEntityByExternalId(
        normalized.entityType,
        provider,
        value,
      );
      if (external && typeof external === "object" && "id" in external) {
        matches.push({
          entityType: normalized.entityType,
          entityId: String(external.id),
          displayName:
            "name" in external && typeof external.name === "string"
              ? external.name
              : normalized.displayName,
          score: 95,
          confidence: "exact",
          reasons: [`same ${provider.toUpperCase()} id`],
          conflicts: [],
          matchedFields: [`${provider}Id`],
        });
      }
    }

    const nameMatches = await this.repository.findEntitiesByNormalizedName(
      normalized.entityType,
      normalized.comparisonName,
    );
    matches.push(
      ...nameMatches.map((match) => ({
        ...match,
        score: Math.max(match.score, 55),
        confidence: scoreToConfidence(Math.max(match.score, 55)),
        reasons: [...match.reasons, "exact normalized name"],
        matchedFields: [...new Set([...match.matchedFields, "normalizedName"])],
      })),
    );

    for (const alias of normalized.normalizedAliases) {
      const aliasMatches = await this.repository.findEntitiesByAlias(normalized.entityType, alias);
      matches.push(
        ...aliasMatches.map((match) => ({
          ...match,
          score: Math.max(match.score, 45),
          confidence: scoreToConfidence(Math.max(match.score, 45)),
          reasons: [...match.reasons, "alias match"],
          matchedFields: [...new Set([...match.matchedFields, "alias"])],
        })),
      );
    }

    return mergeCandidateScores(matches);
  }

  async createReviewItem(result: EntityResolutionResult): Promise<EntityReviewQueueItem> {
    return {
      id: `review-${result.candidate.entityType}-${result.candidate.comparisonName}`,
      candidateType: result.candidate.entityType,
      incomingValue: result.candidate.displayName,
      sourceProvider: result.candidate.provider,
      sourceRecord: result.candidate.providerEntityId,
      bestCandidates: result.alternatives.slice(0, 5),
      scores: result.alternatives.map((candidate) => candidate.score),
      matchedFields: [...new Set(result.alternatives.flatMap((candidate) => candidate.matchedFields))],
      conflicts: [...new Set(result.alternatives.flatMap((candidate) => candidate.conflicts))],
      suggestedAction:
        result.status === "NEW_ENTITY_CANDIDATE"
          ? "create-new"
          : result.status === "CONFLICT"
            ? "defer"
            : "link-existing",
      reviewReasons: result.reviewReasons,
    };
  }

  private async resolve(candidate: ExternalEntityCandidate): Promise<EntityResolutionResult> {
    const normalized = normalizeEntityCandidate(candidate);
    const alternatives = await this.findCandidates(normalized);
    const conflicts = detectConflicts(normalized, alternatives);
    const best = alternatives[0];
    const status = statusFromBestCandidate(best, conflicts);

    return {
      candidate: normalized,
      status,
      selectedEntityId: status === "AUTO_RESOLVED" ? best?.entityId : undefined,
      alternatives,
      confidence: scoreToConfidence(best?.score ?? 0),
      reviewReasons: reviewReasonsFromStatus(status, best, conflicts),
    };
  }
}

export type EntitySeedRecord = {
  entityType: ResolvableEntityType;
  id: string;
  displayName: string;
  aliases?: string[];
  externalIds?: {
    tmdbId?: string | number;
    imdbId?: string;
    wikidataId?: string;
  };
  metadata?: {
    birthDate?: string;
    deathDate?: string;
    originCountryId?: string;
  };
};

export class InMemoryEntityResolutionRepository implements EntityResolutionRepository {
  private readonly entities = new Map<string, EntitySeedRecord>();
  private readonly externalIdIndex = new Map<string, string>();
  private readonly nameIndex = new Map<string, Set<string>>();
  private readonly aliasIndex = new Map<string, Set<string>>();
  private readonly aliasesByEntity = new Map<string, Set<string>>();

  constructor(records: EntitySeedRecord[]) {
    records.forEach((record) => this.addRecord(record));
  }

  async getEntityById(
    entityType: ResolvableEntityType,
    id: string,
  ): Promise<EntitySeedRecord | undefined> {
    const record = this.entities.get(`${entityType}:${id}`);
    return record;
  }

  async getEntityByExternalId(
    entityType: ResolvableEntityType,
    provider: "tmdb" | "imdb" | "wikidata",
    value: string | number,
  ): Promise<EntitySeedRecord | undefined> {
    const id = this.externalIdIndex.get(`${entityType}:${provider}:${value}`);
    return id ? this.getEntityById(entityType, id) : undefined;
  }

  async findEntitiesByNormalizedName(
    entityType: ResolvableEntityType,
    normalizedName: string,
  ): Promise<EntityMatchCandidate[]> {
    return this.idsToCandidates(
      entityType,
      this.nameIndex.get(`${entityType}:${normalizedName}`) ?? new Set(),
      55,
      "normalized name",
      "normalizedName",
    );
  }

  async findEntitiesByAlias(
    entityType: ResolvableEntityType,
    normalizedAlias: string,
  ): Promise<EntityMatchCandidate[]> {
    return this.idsToCandidates(
      entityType,
      this.aliasIndex.get(`${entityType}:${normalizedAlias}`) ?? new Set(),
      45,
      "alias",
      "alias",
    );
  }

  async listEntityCandidates(entityType: ResolvableEntityType): Promise<EntityMatchCandidate[]> {
    return [...this.entities.values()]
      .filter((record) => record.entityType === entityType)
      .map((record) => this.toCandidate(record, 0, "listed candidate", "list"));
  }

  async saveEntityAlias(
    entityType: ResolvableEntityType,
    entityId: string,
    alias: { normalizedValue: string; value: string },
  ): Promise<void> {
    const key = `${entityType}:${entityId}`;
    const record = this.entities.get(key);
    if (!record) {
      return;
    }

    if (!this.aliasesByEntity.has(key)) {
      this.aliasesByEntity.set(key, new Set());
    }
    if (this.aliasesByEntity.get(key)?.has(alias.normalizedValue)) {
      return;
    }

    this.aliasesByEntity.get(key)?.add(alias.normalizedValue);
    this.addAlias(entityType, entityId, alias.normalizedValue);
  }

  async reserveExternalId(
    entityType: ResolvableEntityType,
    entityId: string,
    provider: "tmdb" | "imdb" | "wikidata",
    value: string | number,
  ): Promise<void> {
    const key = `${entityType}:${provider}:${value}`;
    const existing = this.externalIdIndex.get(key);
    if (existing && existing !== entityId) {
      throw new Error(`External ID conflict for ${key}`);
    }
    this.externalIdIndex.set(key, entityId);
  }

  snapshot() {
    return {
      entities: [...this.entities.values()],
      aliases: [...this.aliasesByEntity.entries()].map(([entity, aliases]) => ({
        entity,
        aliases: [...aliases],
      })),
    };
  }

  private addRecord(record: EntitySeedRecord): void {
    const key = `${record.entityType}:${record.id}`;
    this.entities.set(key, record);
    const normalizedName = normalizeComparisonName(record.displayName);

    this.addToIndex(this.nameIndex, `${record.entityType}:${normalizedName}`, record.id);
    (record.aliases ?? []).forEach((alias) =>
      this.addAlias(record.entityType, record.id, normalizeComparisonName(alias)),
    );

    if (record.externalIds?.tmdbId) {
      this.externalIdIndex.set(`${record.entityType}:tmdb:${record.externalIds.tmdbId}`, record.id);
    }
    if (record.externalIds?.imdbId) {
      this.externalIdIndex.set(`${record.entityType}:imdb:${record.externalIds.imdbId}`, record.id);
    }
    if (record.externalIds?.wikidataId) {
      this.externalIdIndex.set(`${record.entityType}:wikidata:${record.externalIds.wikidataId}`, record.id);
    }
  }

  private addAlias(entityType: ResolvableEntityType, entityId: string, alias: string): void {
    this.addToIndex(this.aliasIndex, `${entityType}:${alias}`, entityId);
  }

  private addToIndex(index: Map<string, Set<string>>, key: string, id: string): void {
    if (!index.has(key)) {
      index.set(key, new Set());
    }
    index.get(key)?.add(id);
  }

  private idsToCandidates(
    entityType: ResolvableEntityType,
    ids: Set<string>,
    score: number,
    reason: string,
    field: string,
  ): EntityMatchCandidate[] {
    return [...ids]
      .map((id) => this.entities.get(`${entityType}:${id}`))
      .filter((record): record is EntitySeedRecord => Boolean(record))
      .map((record) => this.toCandidate(record, score, reason, field));
  }

  private toCandidate(
    record: EntitySeedRecord,
    score: number,
    reason: string,
    field: string,
  ): EntityMatchCandidate {
    return {
      entityType: record.entityType,
      entityId: record.id,
      displayName: record.displayName,
      score,
      confidence: scoreToConfidence(score),
      reasons: [reason],
      conflicts: [],
      matchedFields: [field],
    };
  }
}
