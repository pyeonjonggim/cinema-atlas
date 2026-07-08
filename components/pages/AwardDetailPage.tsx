import type { Award } from "@/data/awards";
import type { Country } from "@/data/countries";
import type { Director } from "@/data/directors";
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

type AwardDetailPageProps = {
  award: Award;
  awards: Award[];
  countries: Country[];
  directors: Director[];
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
    label: "Representative Director",
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
    label: "Representative Country",
    title: `${country.flag} ${country.name}`,
    subtitle: country.description,
    meta: country.region,
    imageAlt: country.name,
    visualTone: "place",
  }));
}

function buildAwardItems(awards: Award[]): RelationshipPreviewItem[] {
  return awards.map((award) => ({
    href: `/encyclopedia/awards/${award.slug}`,
    label: "Award",
    title: award.name,
    subtitle: award.organization,
    meta: `${award.foundedYear}`,
    imageAlt: award.name,
    visualTone: "award",
  }));
}

function buildTimelineItems(award: Award): RelationshipPreviewItem[] {
  return (award.timeline ?? []).map((item) => ({
    href: `/encyclopedia/awards/${award.slug}`,
    label: `${item.year}`,
    title: item.title,
    subtitle: item.description,
    meta: "Award History",
    imageAlt: item.title,
    visualTone: "award",
  }));
}

export default function AwardDetailPage({
  award,
  awards,
  countries,
  directors,
  movies,
}: AwardDetailPageProps) {
  const awardCountry = countries.find(
    (country) => country.slug === award.countrySlug
  );

  const awardMovies = movies.filter((movie) =>
    movie.awardSlugs.includes(award.slug)
  );

  const representativeWinningFilms = movies.filter((movie) =>
    award.representativeMovieIds.includes(movie.id)
  );

  const starterMovie = movies.find((movie) => movie.id === award.starterMovieId);

  const representativeDirectors = directors.filter((director) =>
    award.directorSlugs.includes(director.slug)
  );

  const representativeCountries = countries.filter((country) =>
    representativeWinningFilms.some((movie) => movie.countrySlug === country.slug)
  );

  const firstDirector = representativeDirectors[0];
  const firstWinningFilm = representativeWinningFilms[0] ?? awardMovies[0];
  const firstCountrySlug = firstWinningFilm?.countrySlug;
  const firstMovementSlug = firstWinningFilm?.movementSlug;
  const relatedAwards = awards.filter((item) => item.slug !== award.slug);

  const quickFacts: EntityQuickFact[] = [
    {
      label: "Founded",
      value: award.foundedYear,
    },
    {
      label: "Country",
      value: awardCountry
        ? `${awardCountry.flag} ${awardCountry.name}`
        : "Not selected",
    },
    {
      label: "Organization",
      value: award.organization,
    },
    {
      label: "First Awarded",
      value: award.timeline?.[0]?.year ?? award.foundedYear,
    },
    {
      label: "Known For",
      value: "Recognized cinema",
    },
  ];

  const institutionContext = [
    `Purpose: Recognize films through ${award.organization}.`,
    `History: Established in ${award.foundedYear}.`,
    awardCountry
      ? `Institutional context: connected to ${awardCountry.name}.`
      : "Institutional context will expand as country data grows.",
    `Influence on cinema: ${award.whyMatters}`,
  ];

  const keySections = (
    <div className="space-y-6">
      <FeatureListPattern
        title="Award Overview"
        description="Institutional context before exploring winners and recognition history."
        features={award.overview}
      />

      <FeatureListPattern
        title="Institution Context"
        description="Purpose, history, selection philosophy, and influence on cinema."
        features={institutionContext}
      />

      <FeatureListPattern
        title="Selection Philosophy"
        description="How this award guides attention toward cinematic value."
        features={[
          "Recognizes films as cultural, industrial, or artistic milestones.",
          "Connects winning films to directors, countries, movements, and cinema history.",
          "Turns institutional recognition into another path for exploration.",
        ]}
      />

      <RelationshipPreviewPattern
        title="Representative Winners"
        description="Representative winning films appear first. The full award path remains explorable through View All."
        items={buildMovieItems(
          representativeWinningFilms.length > 0
            ? representativeWinningFilms
            : awardMovies,
          "Representative Winner",
          "A key film for understanding this award's cinematic meaning."
        )}
        viewAllHref={`/movies?award=${award.slug}`}
        viewAllLabel="View All Winners"
      />
    </div>
  );

  const timeline = (
    <RelationshipPreviewPattern
      title="Award Timeline"
      description="A compact preview of historical moments connected to this award."
      items={buildTimelineItems(award)}
      viewAllHref={`/encyclopedia/awards/${award.slug}`}
      viewAllLabel="Explore Timeline"
      emptyMessage="Award timeline has not been added yet."
    />
  );

  const relatedEntities = (
    <div className="space-y-6">
      <RelationshipPreviewPattern
        title="Representative Directors"
        description="Recognized filmmakers connect this institution to cinematic authorship."
        items={buildDirectorItems(representativeDirectors)}
        viewAllHref="/encyclopedia/directors"
        viewAllLabel="Browse Directors"
      />

      <RelationshipPreviewPattern
        title="Representative Countries"
        description="Country connections show how recognition travels across world cinema."
        items={buildCountryItems(
          representativeCountries.length > 0
            ? representativeCountries
            : awardCountry
              ? [awardCountry]
              : []
        )}
        viewAllHref="/encyclopedia/countries"
        viewAllLabel="Browse Countries"
      />

      {relatedAwards.length > 0 && (
        <RelationshipPreviewPattern
          title="Related Awards"
          description="Continue through other institutions that recognize cinema."
          items={buildAwardItems(relatedAwards)}
          viewAllHref="/encyclopedia/awards"
          viewAllLabel="Browse Awards"
        />
      )}

      <EntityStartingPointPattern
        movie={starterMovie}
        reason={award.startingPointReason}
      />
    </div>
  );

  const continueJourneyItems = [
    {
      label: "Winning Films",
      title: `Explore ${award.name} Films`,
      description: "Browse films connected to this award.",
      href: `/movies?award=${award.slug}`,
      level: "primary" as const,
    },
    {
      label: "Director",
      title: firstDirector
        ? `Explore ${firstDirector.name}`
        : "Explore Representative Directors",
      description: firstDirector
        ? "Move from an awarded film to a recognized filmmaker."
        : "Representative director data is not available yet.",
      href: firstDirector
        ? `/encyclopedia/directors/${firstDirector.slug}`
        : "/encyclopedia/directors",
      level: "secondary" as const,
      disabled: !firstDirector,
    },
    {
      label: "Country",
      title: firstCountrySlug ? "Explore Winning Film Country" : "Explore Country",
      description: firstCountrySlug
        ? "Follow the country connection through a representative winning film."
        : "Country connection is not available yet.",
      href: firstCountrySlug
        ? `/encyclopedia/countries/${firstCountrySlug}`
        : "/encyclopedia/countries",
      level: "secondary" as const,
      disabled: !firstCountrySlug,
    },
    {
      label: "Movement",
      title: firstMovementSlug
        ? "Explore Winning Film Movement"
        : "Explore Movement",
      description: firstMovementSlug
        ? "Continue through the movement connected to a representative winning film."
        : "Movement connection is not available yet.",
      href: firstMovementSlug
        ? `/encyclopedia/movements/${firstMovementSlug}`
        : "/encyclopedia/movements",
      level: "deep" as const,
      disabled: !firstMovementSlug,
    },
  ];

  return (
    <EncyclopediaDetailTemplate
      hero={
        <EncyclopediaEntityHero
          eyebrow="Award Encyclopedia"
          title={award.name}
          subtitle={award.nameKo}
          description={award.description}
          meta={[
            { label: "Founded", value: award.foundedYear },
            { label: "Organization", value: award.organization },
            {
              label: "Country",
              value: awardCountry ? awardCountry.name : "Not selected",
            },
            {
              label: "Winners",
              value: `${
                representativeWinningFilms.length || awardMovies.length
              } connected`,
            },
          ]}
          tags={["Institution", "Recognition", "Cinema History"]}
          visualTone="award"
        />
      }
      quickFacts={<EntityQuickFactsPattern facts={quickFacts} />}
      overview={
        <EntityOverviewPattern
          title="Why This Award Matters"
          description={award.whyMatters}
        />
      }
      keySections={keySections}
      timeline={timeline}
      relatedEntities={relatedEntities}
      continueJourney={
        <EntityContinueJourneyPattern
          description="Continue from this award into winning films, directors, countries, and movements."
          items={continueJourneyItems}
        />
      }
    />
  );
}
