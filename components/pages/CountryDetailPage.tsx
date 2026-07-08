import type { Country } from "@/data/countries";
import type { Director } from "@/data/directors";
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

type CountryDetailPageProps = {
  country: Country;
  countries: Country[];
  directors: Director[];
  movements: Movement[];
  movies: Movie[];
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
    meta: `${movie.year} / ${movie.director}`,
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
    meta: director.styleKeywords.slice(0, 2).join(", "),
    imageAlt: director.name,
    visualTone: "person",
  }));
}

function buildMovementItems(movements: Movement[]): RelationshipPreviewItem[] {
  return movements.map((movement) => ({
    href: `/encyclopedia/movements/${movement.slug}`,
    label: "Movement",
    title: movement.name,
    subtitle: movement.description,
    meta: movement.period,
    imageAlt: movement.name,
    visualTone: "movement",
  }));
}

export default function CountryDetailPage({
  country,
  directors,
  movements,
  movies,
}: CountryDetailPageProps) {
  const countryMovies = movies.filter(
    (movie) => movie.countrySlug === country.slug
  );

  const essentialFilms = movies.filter((movie) =>
    country.essentialMovieIds.includes(movie.id)
  );

  const starterMovie = movies.find(
    (movie) => movie.id === country.starterMovieId
  );

  const representativeDirectors = directors.filter((director) =>
    country.directorSlugs.includes(director.slug)
  );

  const majorMovements = movements.filter((movement) =>
    country.movementSlugs.includes(movement.slug)
  );

  const mainMovement = majorMovements[0];
  const mainDirector = representativeDirectors[0];

  const quickFacts: EntityQuickFact[] = [
    {
      label: "Region",
      value: country.region,
    },
    {
      label: "Representative Era",
      value: country.representativeEra,
    },
    {
      label: "Known For",
      value: country.knownFor,
    },
    {
      label: "Starter Film",
      value: starterMovie?.title ?? "Not selected",
    },
  ];

  const keySections = (
    <div className="space-y-6">
      <FeatureListPattern
        title="Cinema Overview"
        description="Concise traits that define this national cinema context."
        features={country.characteristics}
      />

      <FeatureListPattern
        title="Recurring Themes"
        description="Ideas that appear across this country's cinematic identity."
        features={country.themes}
      />

      <RelationshipPreviewPattern
        title="Essential Films"
        description="Representative films appear first. The full national cinema path remains explorable through View All."
        items={buildMovieItems(
          essentialFilms.length > 0 ? essentialFilms : countryMovies,
          "Essential Film",
          "A key entry point into this country's cinema."
        )}
        viewAllHref={`/movies?country=${country.slug}`}
        viewAllLabel="View All Films"
      />
    </div>
  );

  const timeline = (
    <RelationshipPreviewPattern
      title="Film History Timeline"
      description="A compact chronological preview of films connected to this country."
      items={buildMovieItems(
        [...countryMovies].sort((a, b) => a.year - b.year),
        "Film History",
        "Continue through this film to understand the country's cinematic development."
      )}
      viewAllHref={`/movies?country=${country.slug}`}
      viewAllLabel="Explore Film History"
    />
  );

  const relatedEntities = (
    <div className="space-y-6">
      <RelationshipPreviewPattern
        title="Representative Directors"
        description="Representative filmmakers connect this country to individual cinematic voices."
        items={buildDirectorItems(representativeDirectors)}
        viewAllHref="/encyclopedia/directors"
        viewAllLabel="Browse Directors"
      />

      <RelationshipPreviewPattern
        title="Major Movements"
        description="Movements show how this country's cinema connects to history, style, and cultural change."
        items={buildMovementItems(majorMovements)}
        viewAllHref="/encyclopedia/movements"
        viewAllLabel="Browse Movements"
      />

      <EntityStartingPointPattern
        movie={starterMovie}
        reason={country.startingPointReason}
      />
    </div>
  );

  const continueJourneyItems = [
    {
      label: "Films",
      title: `Explore ${country.name} Films`,
      description: "Browse films connected to this national cinema.",
      href: `/movies?country=${country.slug}`,
      level: "primary" as const,
    },
    {
      label: "Director",
      title: mainDirector
        ? `Explore ${mainDirector.name}`
        : `Explore ${country.name} Directors`,
      description: mainDirector
        ? "Move from national cinema to a representative filmmaker."
        : "Representative director data is not available yet.",
      href: mainDirector
        ? `/encyclopedia/directors/${mainDirector.slug}`
        : "/encyclopedia/directors",
      level: "secondary" as const,
      disabled: !mainDirector,
    },
    {
      label: "Movement",
      title: mainMovement ? mainMovement.name : "Explore Major Movements",
      description: mainMovement
        ? "Continue through a movement connected to this country."
        : "Movement connection is not available yet.",
      href: mainMovement
        ? `/encyclopedia/movements/${mainMovement.slug}`
        : "/encyclopedia/movements",
      level: "secondary" as const,
      disabled: !mainMovement,
    },
    {
      label: "Starting Point",
      title: starterMovie ? starterMovie.title : "Recommended Starting Point",
      description: starterMovie
        ? "Start with a representative film from this country."
        : "Starting point is not selected yet.",
      href: starterMovie ? `/movies/${starterMovie.id}` : "/movies",
      level: "deep" as const,
      disabled: !starterMovie,
    },
  ];

  return (
    <EncyclopediaDetailTemplate
      hero={
        <EncyclopediaEntityHero
          eyebrow="Country Encyclopedia"
          title={`${country.flag} ${country.name}`}
          subtitle={country.nameKo}
          description={country.description}
          meta={[
            { label: "Region", value: country.region },
            { label: "Era", value: country.representativeEra },
            { label: "Known For", value: country.knownFor },
            { label: "Films", value: `${countryMovies.length} connected` },
          ]}
          tags={country.themes}
          visualTone="place"
        />
      }
      quickFacts={<EntityQuickFactsPattern facts={quickFacts} />}
      overview={
        <EntityOverviewPattern
          title="Why This Country Matters"
          description={country.whyMatters}
        />
      }
      keySections={keySections}
      timeline={timeline}
      relatedEntities={relatedEntities}
      continueJourney={
        <EntityContinueJourneyPattern
          description="Continue from this country into films, directors, movements, and recommended starting points."
          items={continueJourneyItems}
        />
      }
    />
  );
}
