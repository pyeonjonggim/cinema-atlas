import type {
  CatalogImportIssue,
  CatalogImportResult,
  CanonicalMovieDraft,
  ExternalMovieRecord,
} from "@/types/catalog";
import type { NormalizedMovieRecord, RawMovieRecord } from "@/types/import";
import {
  buildDuplicateKeys,
  normalizeRawMovieRecords,
  normalizeTextKey,
  parseYear,
} from "@/lib/normalization";

export type CatalogImportContext = {
  source: "tmdb" | "imdb" | "wikidata" | "manual" | "mixed";
  importedAt: string;
};

export type CatalogImportPipeline = {
  normalizeRawMovies(
    records: RawMovieRecord[],
  ): CatalogImportResult<NormalizedMovieRecord>;
  normalizeExternalMovies(
    records: ExternalMovieRecord[],
  ): CatalogImportResult<NormalizedMovieRecord>;
};

function warning(field: string, message: string): CatalogImportIssue {
  return {
    severity: "warning",
    stage: "normalized",
    entityType: "movie",
    field,
    message,
  };
}

function error(field: string, message: string): CatalogImportIssue {
  return {
    severity: "error",
    stage: "normalized",
    entityType: "movie",
    field,
    message,
  };
}

export function normalizeExternalMovieRecord(
  record: ExternalMovieRecord,
): NormalizedMovieRecord | undefined {
  const title = record.metadata.title ?? record.metadata.originalTitle;
  const titleKey = normalizeTextKey(title);

  if (!title || !titleKey) {
    return undefined;
  }

  const originalTitleKey = normalizeTextKey(record.metadata.originalTitle);
  const year = parseYear(record.metadata.releaseDate);
  const sourceId = record.providerMovieId;

  return {
    title,
    titleKey,
    originalTitle: record.metadata.originalTitle,
    originalTitleKey,
    year,
    runtime: record.metadata.runtime,
    rating: record.metadata.externalRating,
    directorNames:
      record.credits
        ?.filter((credit) => credit.role === "director")
        .map((credit) => credit.name) ?? [],
    actorNames:
      record.credits
        ?.filter((credit) => credit.role === "actor")
        .slice(0, 20)
        .map((credit) => credit.name) ?? [],
    countryNames: record.metadata.productionCountryIds ?? [],
    genreNames: record.metadata.genreIds ?? [],
    movementNames: [],
    awardNames: [],
    posterUrl: record.metadata.poster?.url ?? record.metadata.poster?.path,
    backdropUrl: record.metadata.backdrop?.url ?? record.metadata.backdrop?.path,
    source: record.provider,
    sourceId,
    duplicateKeys: buildDuplicateKeys({
      titleKey,
      originalTitleKey,
      year,
      sourceId: `${record.provider}:${sourceId}`,
    }),
  };
}

function createCatalogId(record: ExternalMovieRecord): string {
  if (record.externalIds.imdbId) {
    return `imdb-${record.externalIds.imdbId}`;
  }

  return `${record.provider}-${record.providerMovieId}`;
}

export function externalMovieToCanonicalDraft(
  record: ExternalMovieRecord,
): CanonicalMovieDraft | undefined {
  const title = record.metadata.title ?? record.metadata.originalTitle;
  if (!title) {
    return undefined;
  }

  return {
    id: createCatalogId(record),
    externalIds: record.externalIds,
    title,
    originalTitle: record.metadata.originalTitle,
    releaseDate: record.metadata.releaseDate,
    year: parseYear(record.metadata.releaseDate),
    runtime: record.metadata.runtime,
    countryIds: record.metadata.productionCountryIds ?? [],
    directorIds:
      record.credits
        ?.filter((credit) => credit.role === "director")
        .map((credit) => credit.externalPersonId)
        .filter((id): id is string => Boolean(id)) ?? [],
    actorIds:
      record.credits
        ?.filter((credit) => credit.role === "actor")
        .map((credit) => credit.externalPersonId)
        .filter((id): id is string => Boolean(id)) ?? [],
    productionCompanyIds: record.metadata.productionCompanyIds ?? [],
    genreIds: record.metadata.genreIds ?? [],
    languageIds: record.metadata.spokenLanguageIds ?? [],
    externalMetadata: record.metadata,
  };
}

export function validateCanonicalMovieDraft(
  draft: CanonicalMovieDraft | undefined,
): CatalogImportIssue[] {
  if (!draft) {
    return [error("canonicalDraft", "External movie could not become a canonical draft.")];
  }

  const issues: CatalogImportIssue[] = [];

  if (!draft.id) {
    issues.push(error("id", "CanonicalMovieDraft requires an internal id candidate."));
  }

  if (!draft.title) {
    issues.push(error("title", "CanonicalMovieDraft requires a title."));
  }

  if (draft.year !== undefined && (draft.year < 1878 || draft.year > 2100)) {
    issues.push(error("year", `Invalid release year: ${draft.year}.`));
  }

  if (draft.runtime !== undefined && (draft.runtime <= 0 || draft.runtime > 1000)) {
    issues.push(error("runtime", `Invalid runtime: ${draft.runtime}.`));
  }

  if (!draft.externalIds.tmdbId && !draft.externalIds.imdbId && !draft.externalIds.wikidataId) {
    issues.push(warning("externalIds", "CanonicalMovieDraft has no known external IDs."));
  }

  if (draft.countryIds.length === 0) {
    issues.push(warning("countryIds", "CanonicalMovieDraft has no production countries."));
  }

  if (draft.languageIds.length === 0) {
    issues.push(warning("languageIds", "CanonicalMovieDraft has no spoken languages."));
  }

  if (draft.directorIds.length === 0) {
    issues.push(warning("directorIds", "CanonicalMovieDraft has no mapped directors."));
  }

  if (!draft.externalMetadata.poster?.path && !draft.externalMetadata.poster?.url) {
    issues.push(warning("poster", "CanonicalMovieDraft has no poster path."));
  }

  if (!draft.externalMetadata.backdrop?.path && !draft.externalMetadata.backdrop?.url) {
    issues.push(warning("backdrop", "CanonicalMovieDraft has no backdrop path."));
  }

  return issues;
}

export const catalogImportPipeline: CatalogImportPipeline = {
  normalizeRawMovies(records) {
    const result = normalizeRawMovieRecords(records);
    const issues = result.duplicateCandidates.map((candidate) =>
      warning(
        "duplicateKeys",
        `Possible duplicate movie records for ${candidate.key}: rows ${candidate.recordIndexes.join(", ")}.`,
      ),
    );

    return {
      stage: "normalized",
      records: result.records,
      issues,
    };
  },

  normalizeExternalMovies(records) {
    const normalizedRecords = records
      .map(normalizeExternalMovieRecord)
      .filter((record): record is NormalizedMovieRecord => Boolean(record));

    const missingTitleCount = records.length - normalizedRecords.length;

    return {
      stage: "normalized",
      records: normalizedRecords,
      issues:
        missingTitleCount > 0
          ? [error("title", `${missingTitleCount} external movie record(s) had no title.`)]
          : [],
    };
  },
};
