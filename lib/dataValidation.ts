import { actors } from "@/data/actors";
import { awards } from "@/data/awards";
import { collections } from "@/data/collections";
import { countries } from "@/data/countries";
import { directors } from "@/data/directors";
import { journalEntries } from "@/data/journalEntries";
import { journeySteps, journeys } from "@/data/journeys";
import { movements } from "@/data/movements";
import { movies } from "@/data/movies";
import {
  achievements,
  challenges,
  milestones,
  userAchievements,
  userChallenges,
} from "@/data/passport";
import { userMovies } from "@/data/userMovies";
import type { Movie } from "@/types/movie";

export type ValidationSeverity = "error" | "warning";

export type ValidationIssue = {
  severity: ValidationSeverity;
  entity: string;
  id: string;
  field: string;
  message: string;
  value?: string;
};

export type ValidationReport = {
  summary: Record<string, number>;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
};

type EntityRecord = {
  slug?: string;
  id?: string;
};

type IssueInput = Omit<ValidationIssue, "severity">;

function issue(
  severity: ValidationSeverity,
  input: IssueInput,
): ValidationIssue {
  return { severity, ...input };
}

function getEntityId(entity: EntityRecord): string {
  return entity.id ?? entity.slug ?? "(missing-id)";
}

function createIdSet(items: EntityRecord[]): Set<string> {
  return new Set(items.map(getEntityId).filter((id) => id !== "(missing-id)"));
}

function validateIdCollection(
  entityName: string,
  items: EntityRecord[],
  idField: "id" | "slug",
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Map<string, number>();

  items.forEach((item) => {
    const id = item[idField];
    if (!id) {
      issues.push(
        issue("error", {
          entity: entityName,
          id: "(missing-id)",
          field: idField,
          message: `${entityName} is missing ${idField}.`,
        }),
      );
      return;
    }

    if (id.trim() !== id || /\s/.test(id)) {
      issues.push(
        issue("error", {
          entity: entityName,
          id,
          field: idField,
          message: `${entityName} ${idField} must be stable, trimmed, and space-free.`,
          value: id,
        }),
      );
    }

    const lower = id.toLocaleLowerCase("en-US");
    if (lower !== id) {
      issues.push(
        issue("warning", {
          entity: entityName,
          id,
          field: idField,
          message: `${entityName} ${idField} should stay lowercase for route safety.`,
          value: id,
        }),
      );
    }

    seen.set(id, (seen.get(id) ?? 0) + 1);
  });

  seen.forEach((count, id) => {
    if (count > 1) {
      issues.push(
        issue("error", {
          entity: entityName,
          id,
          field: idField,
          message: `Duplicate ${entityName} ${idField}: ${id}.`,
          value: id,
        }),
      );
    }
  });

  return issues;
}

function findDuplicateValues(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  values.forEach((value) => {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  });

  return Array.from(duplicates);
}

function validateReferenceList(input: {
  entity: string;
  id: string;
  field: string;
  values: string[] | undefined;
  knownIds: Set<string>;
  severity?: ValidationSeverity;
}): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const values = input.values ?? [];

  findDuplicateValues(values).forEach((duplicate) => {
    issues.push(
      issue("warning", {
        entity: input.entity,
        id: input.id,
        field: input.field,
        message: `Duplicate relation id "${duplicate}" in ${input.field}.`,
        value: duplicate,
      }),
    );
  });

  values.forEach((value) => {
    if (!input.knownIds.has(value)) {
      issues.push(
        issue(input.severity ?? "error", {
          entity: input.entity,
          id: input.id,
          field: input.field,
          message: `Unknown reference "${value}" in ${input.field}.`,
          value,
        }),
      );
    }
  });

  return issues;
}

function validateMovieShape(movie: Movie): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!movie.title.trim()) {
    issues.push(
      issue("error", {
        entity: "Movie",
        id: movie.id,
        field: "title",
        message: "Movie title is required.",
      }),
    );
  }

  if (movie.year < 1878 || movie.year > 2100) {
    issues.push(
      issue("error", {
        entity: "Movie",
        id: movie.id,
        field: "year",
        message: "Movie year must be a plausible release year.",
        value: String(movie.year),
      }),
    );
  }

  if (movie.runtime <= 0 || movie.runtime > 1000) {
    issues.push(
      issue("error", {
        entity: "Movie",
        id: movie.id,
        field: "runtime",
        message: "Movie runtime must be between 1 and 1000 minutes.",
        value: String(movie.runtime),
      }),
    );
  }

  if (movie.rating < 0 || movie.rating > 5) {
    issues.push(
      issue("warning", {
        entity: "Movie",
        id: movie.id,
        field: "rating",
        message: "Movie rating should be a catalog/external average between 0 and 5.",
        value: String(movie.rating),
      }),
    );
  }

  if (movie.myRating !== undefined || movie.watchedDate !== undefined || movie.memo !== undefined) {
    issues.push(
      issue("warning", {
        entity: "Movie",
        id: movie.id,
        field: "user-data",
        message: "User-specific fields should migrate to UserMovie or JournalEntry.",
      }),
    );
  }

  return issues;
}

export function validateMovies(): ValidationIssue[] {
  const movieIds = createIdSet(movies);
  const directorIds = createIdSet(directors);
  const actorIds = createIdSet(actors);
  const countryIds = createIdSet(countries);
  const movementIds = createIdSet(movements);
  const awardIds = createIdSet(awards);

  return [
    ...validateIdCollection("Movie", movies, "id"),
    ...movies.flatMap((movie) => [
      ...validateMovieShape(movie),
      ...validateReferenceList({
        entity: "Movie",
        id: movie.id,
        field: "countryIds",
        values: movie.countryIds ?? [movie.countrySlug],
        knownIds: countryIds,
      }),
      ...validateReferenceList({
        entity: "Movie",
        id: movie.id,
        field: "directorIds",
        values: movie.directorIds ?? [movie.directorSlug],
        knownIds: directorIds,
      }),
      ...validateReferenceList({
        entity: "Movie",
        id: movie.id,
        field: "actorIds",
        values: movie.actorIds ?? movie.actorSlugs,
        knownIds: actorIds,
      }),
      ...validateReferenceList({
        entity: "Movie",
        id: movie.id,
        field: "movementIds",
        values: movie.movementIds ?? [movie.movementSlug],
        knownIds: movementIds,
      }),
      ...validateReferenceList({
        entity: "Movie",
        id: movie.id,
        field: "awardIds",
        values: movie.awardIds ?? movie.awardSlugs,
        knownIds: awardIds,
      }),
      ...validateReferenceList({
        entity: "Movie",
        id: movie.id,
        field: "relatedMovieIds",
        values: movie.relatedMovieIds,
        knownIds: movieIds,
      }),
      ...validateReferenceList({
        entity: "Movie",
        id: movie.id,
        field: "recommendedMovieIds",
        values: movie.recommendedMovieIds,
        knownIds: movieIds,
      }),
    ]),
  ];
}

export function validateDirectors(): ValidationIssue[] {
  const movieIds = createIdSet(movies);
  const directorIds = createIdSet(directors);
  const countryIds = createIdSet(countries);

  return [
    ...validateIdCollection("Director", directors, "slug"),
    ...directors.flatMap((director) => [
      ...validateReferenceList({
        entity: "Director",
        id: director.slug,
        field: "countrySlug",
        values: [director.countrySlug],
        knownIds: countryIds,
      }),
      ...validateReferenceList({
        entity: "Director",
        id: director.slug,
        field: "knownForMovieIds",
        values: director.knownForMovieIds,
        knownIds: movieIds,
      }),
      ...validateReferenceList({
        entity: "Director",
        id: director.slug,
        field: "essentialMovieIds",
        values: director.essentialMovieIds,
        knownIds: movieIds,
      }),
      ...validateReferenceList({
        entity: "Director",
        id: director.slug,
        field: "starterMovieId",
        values: director.starterMovieId ? [director.starterMovieId] : [],
        knownIds: movieIds,
      }),
      ...validateReferenceList({
        entity: "Director",
        id: director.slug,
        field: "relatedDirectorSlugs",
        values: director.relatedDirectorSlugs,
        knownIds: directorIds,
        severity: "warning",
      }),
    ]),
  ];
}

export function validateActors(): ValidationIssue[] {
  const movieIds = createIdSet(movies);
  const actorIds = createIdSet(actors);
  const directorIds = createIdSet(directors);
  const countryIds = createIdSet(countries);

  return [
    ...validateIdCollection("Actor", actors, "slug"),
    ...actors.flatMap((actor) => [
      ...validateReferenceList({
        entity: "Actor",
        id: actor.slug,
        field: "countrySlug",
        values: [actor.countrySlug],
        knownIds: countryIds,
      }),
      ...validateReferenceList({
        entity: "Actor",
        id: actor.slug,
        field: "essentialMovieIds",
        values: actor.essentialMovieIds,
        knownIds: movieIds,
      }),
      ...validateReferenceList({
        entity: "Actor",
        id: actor.slug,
        field: "starterMovieId",
        values: [actor.starterMovieId],
        knownIds: movieIds,
      }),
      ...validateReferenceList({
        entity: "Actor",
        id: actor.slug,
        field: "frequentDirectorSlugs",
        values: actor.frequentDirectorSlugs,
        knownIds: directorIds,
        severity: "warning",
      }),
      ...validateReferenceList({
        entity: "Actor",
        id: actor.slug,
        field: "movieAppearance",
        values: movies
          .filter((movie) => movie.actorIds?.includes(actor.slug) || movie.actorSlugs.includes(actor.slug))
          .map((movie) => movie.id),
        knownIds: actorIds.has(actor.slug) ? movieIds : new Set<string>(),
      }),
    ]),
  ];
}

export function validateCountries(): ValidationIssue[] {
  const movieIds = createIdSet(movies);
  const directorIds = createIdSet(directors);
  const movementIds = createIdSet(movements);

  return [
    ...validateIdCollection("Country", countries, "slug"),
    ...countries.flatMap((country) => [
      ...validateReferenceList({
        entity: "Country",
        id: country.slug,
        field: "essentialMovieIds",
        values: country.essentialMovieIds,
        knownIds: movieIds,
      }),
      ...validateReferenceList({
        entity: "Country",
        id: country.slug,
        field: "starterMovieId",
        values: [country.starterMovieId],
        knownIds: movieIds,
      }),
      ...validateReferenceList({
        entity: "Country",
        id: country.slug,
        field: "directorSlugs",
        values: country.directorSlugs,
        knownIds: directorIds,
      }),
      ...validateReferenceList({
        entity: "Country",
        id: country.slug,
        field: "movementSlugs",
        values: country.movementSlugs,
        knownIds: movementIds,
      }),
    ]),
  ];
}

export function validateMovements(): ValidationIssue[] {
  const movieIds = createIdSet(movies);
  const directorIds = createIdSet(directors);
  const countryIds = createIdSet(countries);
  const movementIds = createIdSet(movements);

  return [
    ...validateIdCollection("Movement", movements, "slug"),
    ...movements.flatMap((movement) => [
      ...validateReferenceList({
        entity: "Movement",
        id: movement.slug,
        field: "essentialMovieIds",
        values: movement.essentialMovieIds,
        knownIds: movieIds,
      }),
      ...validateReferenceList({
        entity: "Movement",
        id: movement.slug,
        field: "starterMovieId",
        values: [movement.starterMovieId],
        knownIds: movieIds,
      }),
      ...validateReferenceList({
        entity: "Movement",
        id: movement.slug,
        field: "directorSlugs",
        values: movement.directorSlugs,
        knownIds: directorIds,
      }),
      ...validateReferenceList({
        entity: "Movement",
        id: movement.slug,
        field: "countrySlugs",
        values: movement.countrySlugs,
        knownIds: countryIds,
      }),
      ...validateReferenceList({
        entity: "Movement",
        id: movement.slug,
        field: "relatedMovementSlugs",
        values: movement.relatedMovementSlugs,
        knownIds: movementIds,
        severity: "warning",
      }),
    ]),
  ];
}

export function validateAwards(): ValidationIssue[] {
  const movieIds = createIdSet(movies);
  const directorIds = createIdSet(directors);
  const countryIds = createIdSet(countries);

  return [
    ...validateIdCollection("Award", awards, "slug"),
    ...awards.flatMap((award) => [
      ...validateReferenceList({
        entity: "Award",
        id: award.slug,
        field: "countrySlug",
        values: [award.countrySlug],
        knownIds: countryIds,
        severity: "warning",
      }),
      ...validateReferenceList({
        entity: "Award",
        id: award.slug,
        field: "representativeMovieIds",
        values: award.representativeMovieIds,
        knownIds: movieIds,
      }),
      ...validateReferenceList({
        entity: "Award",
        id: award.slug,
        field: "starterMovieId",
        values: [award.starterMovieId],
        knownIds: movieIds,
      }),
      ...validateReferenceList({
        entity: "Award",
        id: award.slug,
        field: "directorSlugs",
        values: award.directorSlugs,
        knownIds: directorIds,
      }),
    ]),
  ];
}

export function validateEntityRelations(): ValidationIssue[] {
  const movieIds = createIdSet(movies);
  const collectionIssues = collections.flatMap((collection) =>
    validateReferenceList({
      entity: "Collection",
      id: collection.id,
      field: "movieIds",
      values: collection.movieIds,
      knownIds: movieIds,
    }),
  );

  const journalIssues = journalEntries.flatMap((journal) =>
    validateReferenceList({
      entity: "JournalEntry",
      id: journal.id,
      field: "movieId",
      values: [journal.movieId],
      knownIds: movieIds,
    }),
  );

  const userMovieIssues = userMovies.flatMap((userMovie) =>
    validateReferenceList({
      entity: "UserMovie",
      id: userMovie.movieId,
      field: "movieId",
      values: [userMovie.movieId],
      knownIds: movieIds,
    }),
  );

  const journeyIds = createIdSet(journeys);
  const stepIds = createIdSet(journeySteps);
  const challengeIds = createIdSet(challenges);
  const achievementIds = createIdSet(achievements);
  const milestoneIds = createIdSet(milestones);

  const journeyIssues = [
    ...journeys.flatMap((journey) =>
      validateReferenceList({
        entity: "Journey",
        id: journey.id,
        field: "stepIds",
        values: journey.stepIds,
        knownIds: stepIds,
      }),
    ),
    ...journeySteps.flatMap((step) =>
      validateReferenceList({
        entity: "JourneyStep",
        id: step.id,
        field: "journeyId",
        values: [step.journeyId],
        knownIds: journeyIds,
      }),
    ),
  ];

  const passportIssues = [
    ...challenges.flatMap((challenge) =>
      validateReferenceList({
        entity: "Challenge",
        id: challenge.id,
        field: "achievementId",
        values: challenge.achievementId ? [challenge.achievementId] : [],
        knownIds: achievementIds,
        severity: "warning",
      }),
    ),
    ...userChallenges.flatMap((userChallenge) =>
      validateReferenceList({
        entity: "UserChallenge",
        id: userChallenge.challengeId,
        field: "challengeId",
        values: [userChallenge.challengeId],
        knownIds: challengeIds,
      }),
    ),
    ...userAchievements.flatMap((userAchievement) =>
      validateReferenceList({
        entity: "UserAchievement",
        id: userAchievement.achievementId,
        field: "achievementId",
        values: [userAchievement.achievementId],
        knownIds: achievementIds,
      }),
    ),
    ...milestones.flatMap((milestone) =>
      validateReferenceList({
        entity: "Milestone",
        id: milestone.id,
        field: "id",
        values: [milestone.id],
        knownIds: milestoneIds,
      }),
    ),
  ];

  return [
    ...collectionIssues,
    ...journalIssues,
    ...userMovieIssues,
    ...journeyIssues,
    ...passportIssues,
  ];
}

export function validateCinemaAtlasData(): ValidationReport {
  const issues = [
    ...validateMovies(),
    ...validateDirectors(),
    ...validateActors(),
    ...validateCountries(),
    ...validateMovements(),
    ...validateAwards(),
    ...validateEntityRelations(),
  ];

  return {
    summary: {
      Movies: movies.length,
      Directors: directors.length,
      Actors: actors.length,
      Countries: countries.length,
      Movements: movements.length,
      Awards: awards.length,
      UserMovies: userMovies.length,
      Journals: journalEntries.length,
      Collections: collections.length,
      Journeys: journeys.length,
      Challenges: challenges.length,
      Achievements: achievements.length,
    },
    errors: issues.filter((item) => item.severity === "error"),
    warnings: issues.filter((item) => item.severity === "warning"),
  };
}

export function formatValidationReport(report: ValidationReport): string {
  const lines = [
    "Cinema Atlas Data Validation",
    "",
    ...Object.entries(report.summary).map(([label, count]) => `${label}: ${count} valid`),
    "",
    `Warnings: ${report.warnings.length}`,
    `Errors: ${report.errors.length}`,
  ];

  const details = [...report.errors, ...report.warnings];
  if (details.length > 0) {
    lines.push("", "Issues:");
    details.forEach((item) => {
      lines.push(
        `[${item.severity.toUpperCase()}] ${item.entity} ${item.id} :: ${item.field} - ${item.message}`,
      );
    });
  }

  return lines.join("\n");
}

