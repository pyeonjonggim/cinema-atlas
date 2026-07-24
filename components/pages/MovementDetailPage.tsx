import type { Country } from "@/data/countries";
import type { Director } from "@/data/directors";
import type { EntityContinueJourneyItem } from "@/components/patterns/EntityContinueJourneyPattern";
import type { Movement } from "@/data/movements";
import type { Movie } from "@/types/movie";

import EncyclopediaEntityHero from "../entity/EncyclopediaEntityHero";
import EncyclopediaDetailTemplate from "../templates/EncyclopediaDetailTemplate";
import EntityContinueJourneyPattern from "../patterns/EntityContinueJourneyPattern";
import EntityOverviewPattern from "../patterns/EntityOverviewPattern";
import EntityQuickFactsPattern, {
  type EntityQuickFact,
} from "../patterns/EntityQuickFactsPattern";
import EntityStartingPointPattern from "../patterns/EntityStartingPointPattern";
import FeatureListPattern from "../patterns/FeatureListPattern";
import RelationshipPreviewPattern, {
  type RelationshipPreviewItem,
} from "../patterns/RelationshipPreviewPattern";

type MovementDetailPageProps = {
  movement: Movement;
  movements: Movement[];
  countries: Country[];
  directors: Director[];
  movies: Movie[];
  continueJourneyItems?: EntityContinueJourneyItem[];
};

function buildMovieItems(
  movies: Movie[],
  label: string,
  subtitle: string
): RelationshipPreviewItem[] {
  return movies.map((movie) => ({
    href: `/movies/${movie.id}`,
    label,
    title: movie.title,
    subtitle,
    meta: `${movie.year} / ${movie.country}`,
    image: movie.poster || undefined,
    imageAlt: `${movie.title} poster`,
    imageAspect: "poster",
    visualTone: "movie",
  }));
}

function buildDirectorItems(directors: Director[]): RelationshipPreviewItem[] {
  return directors.map((director) => ({
    href: `/encyclopedia/directors/${director.slug}`,
    label: "Director",
    title: director.name,
    subtitle: director.description,
    meta: director.country,
    imageAlt: director.name,
    visualTone: "person",
  }));
}

function buildCountryItems(countries: Country[]): RelationshipPreviewItem[] {
  return countries.map((country) => ({
    href: `/encyclopedia/countries/${country.slug}`,
    label: "Country",
    title: `${country.flag} ${country.name}`,
    subtitle: country.description,
    meta: country.region,
    imageAlt: country.name,
    visualTone: "place",
  }));
}

function buildMovementItems(movements: Movement[]): RelationshipPreviewItem[] {
  return movements.map((movement) => ({
    href: `/encyclopedia/movements/${movement.slug}`,
    label: "Related Movement",
    title: movement.name,
    subtitle: movement.description,
    meta: movement.period,
    imageAlt: movement.name,
    visualTone: "movement",
  }));
}

export default function MovementDetailPage({
  movement,
  movements,
  countries,
  directors,
  movies,
  continueJourneyItems,
}: MovementDetailPageProps) {
  const movementMovies = movies.filter(
    (movie) => movie.movementSlug === movement.slug
  );

  const essentialFilms = movies.filter((movie) =>
    movement.essentialMovieIds.includes(movie.id)
  );

  const starterMovie = movies.find(
    (movie) => movie.id === movement.starterMovieId
  );

  const representativeDirectors = directors.filter((director) =>
    movement.directorSlugs.includes(director.slug)
  );

  const relatedCountries = countries.filter((country) =>
    movement.countrySlugs.includes(country.slug)
  );

  const relatedMovements = movements.filter((item) =>
    movement.relatedMovementSlugs?.includes(item.slug)
  );

  const mainCountry = relatedCountries[0];
  const mainDirector = representativeDirectors[0];
  const coreTheme = movement.themes[0] ?? "Not selected";

  const quickFacts: EntityQuickFact[] = [
    {
      label: "Era",
      value: movement.period,
    },
    {
      label: "Origin",
      value: mainCountry ? `${mainCountry.flag} ${mainCountry.name}` : "Not selected",
    },
    {
      label: "Representative Director",
      value: mainDirector?.name ?? "Not selected",
    },
    {
      label: "Starter Film",
      value: starterMovie?.title ?? "Not selected",
    },
    {
      label: "Known For",
      value: coreTheme,
    },
  ];

  const historicalContext = [
    `Period: ${movement.period}`,
    mainCountry
      ? `Origin context: ${mainCountry.name} cinema`
      : "Origin context will expand as more country relationships are added.",
    mainDirector
      ? `Representative voice: ${mainDirector.name}`
      : "Representative director data will expand as the Encyclopedia grows.",
  ];

  const keySections = (
    <div className="space-y-6">
      <EntityOverviewPattern
        title="Movement Overview"
        description={movement.description}
      />

      <FeatureListPattern
        title="Key Characteristics"
        description="Concise traits that define how this movement thinks, looks, and moves."
        features={movement.characteristics}
      />

      <FeatureListPattern
        title="Historical Context"
        description="The movement's period, origin, and representative creative context."
        features={historicalContext}
      />

      <FeatureListPattern
        title="Core Ideas"
        description="Recurring ideas that connect films inside this movement."
        features={movement.themes}
      />

      <RelationshipPreviewPattern
        title="Essential Films"
        description="Representative films appear first. The full movement path remains explorable through View All."
        items={buildMovieItems(
          essentialFilms.length > 0 ? essentialFilms : movementMovies,
          "Essential Film",
          "A key entry point into this movement."
        )}
        viewAllHref={`/movies?movement=${movement.slug}`}
        viewAllLabel="View All Films"
      />
    </div>
  );

  const timeline = (
    <RelationshipPreviewPattern
      title="Movement Timeline"
      description="A compact chronological preview of films connected to this movement."
      items={buildMovieItems(
        [...movementMovies].sort((a, b) => a.year - b.year),
        "Movement Timeline",
        "Continue through this film to understand the movement's development."
      )}
      viewAllHref={`/movies?movement=${movement.slug}`}
      viewAllLabel="Explore Timeline"
    />
  );

  const relatedEntities = (
    <div className="space-y-6">
      <RelationshipPreviewPattern
        title="Representative Directors"
        description="Representative filmmakers show how this movement becomes a cinematic voice."
        items={buildDirectorItems(representativeDirectors)}
        viewAllHref="/encyclopedia/directors"
        viewAllLabel="Browse Directors"
      />

      <RelationshipPreviewPattern
        title="Related Countries"
        description="Country connections place this movement inside a wider cinematic context."
        items={buildCountryItems(relatedCountries)}
        viewAllHref="/encyclopedia/countries"
        viewAllLabel="Browse Countries"
      />

      {relatedMovements.length > 0 && (
        <RelationshipPreviewPattern
          title="Related Movements"
          description="Continue through movements connected by period, style, or historical context."
          items={buildMovementItems(relatedMovements)}
          viewAllHref="/encyclopedia/movements"
          viewAllLabel="Browse Movements"
        />
      )}

      <EntityStartingPointPattern
        movie={starterMovie}
        reason={movement.startingPointReason}
      />
    </div>
  );

  const fallbackContinueJourneyItems = [
    {
      label: "Films",
      title: `Explore ${movement.name} Films`,
      description: "Browse films connected to this film movement.",
      href: `/movies?movement=${movement.slug}`,
      level: "primary" as const,
    },
    {
      label: "Director",
      title: mainDirector
        ? `Explore ${mainDirector.name}`
        : "Explore Representative Directors",
      description: mainDirector
        ? "Continue through a key filmmaker connected to this movement."
        : "Representative director data is not available yet.",
      href: mainDirector
        ? `/encyclopedia/directors/${mainDirector.slug}`
        : "/encyclopedia/directors",
      level: "secondary" as const,
      disabled: !mainDirector,
    },
    {
      label: "Country",
      title: mainCountry
        ? `Explore ${mainCountry.name} Cinema`
        : "Explore Related Country",
      description: mainCountry
        ? "Move from this movement to its national cinema context."
        : "Country connection is not available yet.",
      href: mainCountry
        ? `/encyclopedia/countries/${mainCountry.slug}`
        : "/encyclopedia/countries",
      level: "secondary" as const,
      disabled: !mainCountry,
    },
    {
      label: "Starting Point",
      title: starterMovie ? starterMovie.title : "Recommended Starting Point",
      description: starterMovie
        ? "Start with a representative film from this movement."
        : "Starting point is not selected yet.",
      href: starterMovie ? `/movies/${starterMovie.id}` : "/movies",
      level: "deep" as const,
      disabled: !starterMovie,
    },
  ];
  const journeyItems = continueJourneyItems?.length ? continueJourneyItems : fallbackContinueJourneyItems;

  return (
    <EncyclopediaDetailTemplate
      hero={
        <EncyclopediaEntityHero
          eyebrow="Movement Encyclopedia"
          title={movement.name}
          subtitle={movement.period}
          description={movement.description}
          meta={[
            { label: "Period", value: movement.period },
            {
              label: "Origin",
              value: mainCountry ? mainCountry.name : "Not selected",
            },
            {
              label: "Director",
              value: mainDirector ? mainDirector.name : "Not selected",
            },
            { label: "Films", value: `${movementMovies.length} connected` },
          ]}
          tags={movement.themes}
          visualTone="movement"
        />
      }
      quickFacts={<EntityQuickFactsPattern facts={quickFacts} />}
      overview={
        <EntityOverviewPattern
          title="Why This Movement Matters"
          description={movement.whyMatters}
        />
      }
      keySections={keySections}
      timeline={timeline}
      relatedEntities={relatedEntities}
      continueJourney={
        <EntityContinueJourneyPattern
          description="Continue from this movement into films, directors, countries, and recommended starting points."
          items={journeyItems}
          mode="curated"
        />
      }
    />
  );
}

