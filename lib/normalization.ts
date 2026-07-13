import type {
  ImportDuplicateCandidate,
  ImportNormalizationResult,
  NormalizedMovieRecord,
  RawMovieRecord,
} from "@/types/import";

export function normalizeWhitespace(value?: string | null): string | undefined {
  const normalized = value?.normalize("NFKC").replace(/\s+/g, " ").trim();
  return normalized ? normalized : undefined;
}

export function normalizeTextKey(value?: string | null): string | undefined {
  return normalizeWhitespace(value)?.toLocaleLowerCase("en-US");
}

export function normalizeNameList(
  value?: string[] | string | null,
): string[] {
  if (!value) {
    return [];
  }

  const values = Array.isArray(value) ? value : value.split(/[,;/|]/);
  return Array.from(
    new Set(
      values
        .map((item) => normalizeWhitespace(item))
        .filter((item): item is string => Boolean(item)),
    ),
  );
}

export function parseYear(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value >= 1878 && value <= 2100 ? value : undefined;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const match = value.match(/\b(18[7-9]\d|19\d{2}|20\d{2}|2100)\b/);
  return match ? Number(match[1]) : undefined;
}

export function parseRuntime(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 0 && value <= 1000 ? Math.round(value) : undefined;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    return undefined;
  }

  const hours = normalized.match(/(\d+)\s*h/i);
  const minutes = normalized.match(/(\d+)\s*m/i);
  if (hours || minutes) {
    return (hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0);
  }

  const numeric = Number(normalized.replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) && numeric > 0 && numeric <= 1000
    ? Math.round(numeric)
    : undefined;
}

export function normalizeRating(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const numeric = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 5) {
    return undefined;
  }

  return Math.round(numeric * 10) / 10;
}

export function normalizeDate(value?: string | Date | null): string | undefined {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString().slice(0, 10);
  }

  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    return undefined;
  }

  const directDate = new Date(normalized);
  if (!Number.isNaN(directDate.getTime())) {
    return directDate.toISOString().slice(0, 10);
  }

  const match = normalized.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (!match) {
    return undefined;
  }

  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export function buildDuplicateKeys(record: {
  titleKey: string;
  originalTitleKey?: string;
  year?: number;
  sourceId?: string;
}): string[] {
  const keys = new Set<string>();

  if (record.year) {
    keys.add(`title:${record.titleKey}:${record.year}`);
    if (record.originalTitleKey) {
      keys.add(`original:${record.originalTitleKey}:${record.year}`);
    }
  }

  if (record.sourceId) {
    keys.add(`source:${record.sourceId}`);
  }

  return Array.from(keys);
}

export function normalizeRawMovieRecord(
  record: RawMovieRecord,
): NormalizedMovieRecord {
  const title = normalizeWhitespace(record.rawTitle);
  if (!title) {
    throw new Error("RawMovieRecord.rawTitle is required.");
  }

  const originalTitle = normalizeWhitespace(record.originalTitle);
  const titleKey = normalizeTextKey(title) ?? title.toLocaleLowerCase("en-US");
  const originalTitleKey = normalizeTextKey(originalTitle);
  const year = parseYear(record.year);
  const sourceId = normalizeWhitespace(record.sourceId);

  return {
    title,
    titleKey,
    originalTitle,
    originalTitleKey,
    year,
    runtime: parseRuntime(record.runtime),
    rating: normalizeRating(record.rating),
    watchedDate: normalizeDate(record.watchedDate),
    directorNames: normalizeNameList(record.directorNames),
    actorNames: normalizeNameList(record.actorNames),
    countryNames: normalizeNameList(record.countryNames),
    genreNames: normalizeNameList(record.genreNames),
    movementNames: normalizeNameList(record.movementNames),
    awardNames: normalizeNameList(record.awardNames),
    posterUrl: normalizeWhitespace(record.posterUrl),
    backdropUrl: normalizeWhitespace(record.backdropUrl),
    memo: normalizeWhitespace(record.memo),
    source: record.source ?? "unknown",
    sourceId,
    duplicateKeys: buildDuplicateKeys({
      titleKey,
      originalTitleKey,
      year,
      sourceId,
    }),
  };
}

export function normalizeRawMovieRecords(
  records: RawMovieRecord[],
): ImportNormalizationResult {
  const normalizedRecords = records.map(normalizeRawMovieRecord);
  const keyToIndexes = new Map<string, number[]>();

  normalizedRecords.forEach((record, index) => {
    record.duplicateKeys.forEach((key) => {
      keyToIndexes.set(key, [...(keyToIndexes.get(key) ?? []), index]);
    });
  });

  const duplicateCandidates: ImportDuplicateCandidate[] = Array.from(
    keyToIndexes.entries(),
  )
    .filter(([, recordIndexes]) => recordIndexes.length > 1)
    .map(([key, recordIndexes]) => ({ key, recordIndexes }));

  return {
    records: normalizedRecords,
    duplicateCandidates,
  };
}

