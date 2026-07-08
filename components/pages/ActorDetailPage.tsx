import type { Actor } from "@/data/actors";
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

type ActorDetailPageProps = {
  actor: Actor;
  actors: Actor[];
  countries: Country[];
  directors: Director[];
  movies: Movie[];
};

type FrequentDirector = {
  slug: string;
  name: string;
  count: number;
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

function buildDirectorItems(
  frequentDirectors: FrequentDirector[],
  directors: Director[]
): RelationshipPreviewItem[] {
  return frequentDirectors.map((item) => {
    const director = directors.find((candidate) => candidate.slug === item.slug);

    return {
      href: `/encyclopedia/directors/${item.slug}`,
      label: "Frequent Director",
      title: item.name,
      subtitle:
        director?.description ??
        "A director connected through repeated performance collaboration.",
      meta: `${item.count} connected film${item.count === 1 ? "" : "s"}`,
      imageAlt: item.name,
      visualTone: "person",
    };
  });
}

function buildCountryItems(country?: Country): RelationshipPreviewItem[] {
  if (!country) return [];

  return [
    {
      href: `/encyclopedia/countries/${country.slug}`,
      label: "Country",
      title: `${country.flag} ${country.name}`,
      subtitle: country.description,
      meta: country.region,
      imageAlt: country.name,
      visualTone: "place",
    },
  ];
}

function buildFrequentDirectors(
  actorMovies: Movie[],
  directors: Director[]
): FrequentDirector[] {
  const directorCountMap = new Map<string, FrequentDirector>();

  actorMovies.forEach((movie) => {
    const director = directors.find((item) => item.slug === movie.directorSlug);

    if (!director) return;

    const existing = directorCountMap.get(director.slug);

    directorCountMap.set(director.slug, {
      slug: director.slug,
      name: director.name,
      count: existing ? existing.count + 1 : 1,
    });
  });

  return Array.from(directorCountMap.values()).sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name)
  );
}

export default function ActorDetailPage({
  actor,
  countries,
  directors,
  movies,
}: ActorDetailPageProps) {
  const actorCountry = countries.find(
    (country) => country.slug === actor.countrySlug
  );

  const actorMovies = movies.filter((movie) =>
    movie.actorSlugs.includes(actor.slug)
  );

  const essentialFilms = movies.filter((movie) =>
    actor.essentialMovieIds.includes(movie.id)
  );

  const starterMovie = movies.find((movie) => movie.id === actor.starterMovieId);

  const frequentDirectors = buildFrequentDirectors(actorMovies, directors);
  const explicitFrequentDirectors =
    actor.frequentDirectorSlugs
      ?.map((slug) => {
        const director = directors.find((item) => item.slug === slug);
        const counted = frequentDirectors.find((item) => item.slug === slug);

        if (!director) return undefined;

        return {
          slug: director.slug,
          name: director.name,
          count: counted?.count ?? 1,
        };
      })
      .filter((item): item is FrequentDirector => Boolean(item)) ?? [];

  const directorPreview =
    explicitFrequentDirectors.length > 0
      ? explicitFrequentDirectors
      : frequentDirectors;

  const mainDirector = directorPreview[0];
  const mainMovie = starterMovie ?? actorMovies[0];
  const mainMovementSlug = mainMovie?.movementSlug;
  const mainMovement = mainMovie?.movement;
  const knownFor = actor.screenPersona[0] ?? actor.keyRoles[0] ?? "Performance";

  const quickFacts: EntityQuickFact[] = [
    {
      label: "Country",
      value: actorCountry
        ? `${actorCountry.flag} ${actorCountry.name}`
        : "Not selected",
    },
    {
      label: "Birth Year",
      value: actor.birthYear,
    },
    {
      label: "Known For",
      value: knownFor,
    },
    {
      label: "Starter Film",
      value: starterMovie?.title ?? "Not selected",
    },
    {
      label: "Screen Persona",
      value: actor.screenPersona[0] ?? "Not selected",
    },
  ];

  const keySections = (
    <div className="space-y-6">
      <FeatureListPattern
        title="Screen Persona"
        description="Concise performance qualities that define this actor's screen presence."
        features={actor.screenPersona}
      />

      <FeatureListPattern
        title="Key Roles"
        description="Representative role types that shape this actor's cinematic identity."
        features={actor.keyRoles}
      />

      <RelationshipPreviewPattern
        title="Essential Films"
        description="Representative films appear first. The full performance path remains explorable through View All."
        items={buildMovieItems(
          essentialFilms.length > 0 ? essentialFilms : actorMovies,
          "Essential Film",
          "A key entry point into this actor's performance world."
        )}
        viewAllHref={`/movies?actor=${actor.slug}`}
        viewAllLabel="View All Films"
      />
    </div>
  );

  const timeline = (
    <RelationshipPreviewPattern
      title="Career Timeline"
      description="A compact chronological preview of films connected to this actor."
      items={buildMovieItems(
        [...actorMovies].sort((a, b) => a.year - b.year),
        "Career Timeline",
        "Continue through this film to understand the actor's screen development."
      )}
      viewAllHref={`/movies?actor=${actor.slug}`}
      viewAllLabel="Explore Career"
    />
  );

  const relatedEntities = (
    <div className="space-y-6">
      <RelationshipPreviewPattern
        title="Frequent Directors"
        description="Director collaborations show how performance connects to cinematic authorship."
        items={buildDirectorItems(directorPreview, directors)}
        viewAllHref="/encyclopedia/directors"
        viewAllLabel="Browse Directors"
      />

      <RelationshipPreviewPattern
        title="Related Country"
        description="Country context connects this actor to a wider cinematic landscape."
        items={buildCountryItems(actorCountry)}
        viewAllHref="/encyclopedia/countries"
        viewAllLabel="Browse Countries"
      />

      <RelationshipPreviewPattern
        title="Related Movies"
        description="Films connected through this actor's performance path."
        items={buildMovieItems(
          actorMovies.filter((movie) => movie.id !== starterMovie?.id),
          "Related Movie",
          "A related performance connection."
        )}
        viewAllHref={`/movies?actor=${actor.slug}`}
        viewAllLabel="Explore Filmography"
      />

      <EntityStartingPointPattern
        movie={starterMovie}
        reason={actor.startingPointReason}
      />
    </div>
  );

  const continueJourneyItems = [
    {
      label: "Films",
      title: `Explore ${actor.name}'s Films`,
      description: "Browse films connected to this actor.",
      href: `/movies?actor=${actor.slug}`,
      level: "primary" as const,
    },
    {
      label: "Director",
      title: mainDirector
        ? `Explore ${mainDirector.name}`
        : "Explore Frequent Directors",
      description: mainDirector
        ? "Move from this actor to a director they worked with."
        : "Director connection is not available yet.",
      href: mainDirector
        ? `/encyclopedia/directors/${mainDirector.slug}`
        : "/encyclopedia/directors",
      level: "secondary" as const,
      disabled: !mainDirector,
    },
    {
      label: "Country",
      title: actorCountry
        ? `Explore ${actorCountry.name} Cinema`
        : "Explore Country",
      description: actorCountry
        ? "Connect this actor to a wider national cinema context."
        : "Country connection is not available yet.",
      href: actorCountry
        ? `/encyclopedia/countries/${actorCountry.slug}`
        : "/encyclopedia/countries",
      level: "secondary" as const,
      disabled: !actorCountry,
    },
    {
      label: "Movement",
      title: mainMovement ?? "Explore Movement",
      description: mainMovement
        ? "Continue through the film movement connected to this actor."
        : "Movement connection is not available yet.",
      href: mainMovementSlug
        ? `/encyclopedia/movements/${mainMovementSlug}`
        : "/encyclopedia/movements",
      level: "deep" as const,
      disabled: !mainMovementSlug,
    },
  ];

  return (
    <EncyclopediaDetailTemplate
      hero={
        <EncyclopediaEntityHero
          eyebrow="Actor Encyclopedia"
          title={actor.name}
          subtitle={actor.nameKo}
          description={actor.description}
          meta={[
            {
              label: "Country",
              value: actorCountry ? actorCountry.name : "Not selected",
            },
            {
              label: "Years",
              value: actor.deathYear
                ? `${actor.birthYear}-${actor.deathYear}`
                : `${actor.birthYear}-`,
            },
            { label: "Known For", value: knownFor },
            { label: "Films", value: `${actorMovies.length} connected` },
          ]}
          tags={actor.screenPersona.slice(0, 4)}
          visualTone="person"
        />
      }
      quickFacts={<EntityQuickFactsPattern facts={quickFacts} />}
      overview={
        <EntityOverviewPattern
          title="Why This Actor Matters"
          description={actor.whyMatters}
        />
      }
      keySections={keySections}
      timeline={timeline}
      relatedEntities={relatedEntities}
      continueJourney={
        <EntityContinueJourneyPattern
          description="Continue from this actor into films, directors, countries, and performance journeys."
          items={continueJourneyItems}
        />
      }
    />
  );
}
