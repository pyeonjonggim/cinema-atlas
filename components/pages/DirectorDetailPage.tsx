import Link from "next/link";

import type { Director } from "@/data/directors";
import type { EntityImage } from "@/lib/media";
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

type DirectorDetailPageProps = {
  director: Director;
  directors: Director[];
  movies: Movie[];
};

type CollaboratorItem = {
  name: string;
  slug: string;
  count: number;
};

function getDirectorsBySlugs(slugs: string[] | undefined, directors: Director[]) {
  if (!slugs?.length) return [];

  return slugs
    .map((slug) => directors.find((item) => item.slug === slug))
    .filter((item): item is Director => Boolean(item));
}

function buildCollaborators(directorMovies: Movie[]): CollaboratorItem[] {
  const collaboratorMap = new Map<string, CollaboratorItem>();

  directorMovies.forEach((movie) => {
    const cast =
      movie.cast?.length
        ? movie.cast.map((member) => ({
            actorSlug: member.actorId,
            actorName:
              movie.actors[movie.actorSlugs.indexOf(member.actorId)] ??
              member.actorId,
          }))
        : movie.actorSlugs.map((actorSlug, index) => ({
            actorSlug,
            actorName: movie.actors[index] ?? actorSlug,
          }));

    cast.forEach(({ actorSlug, actorName }) => {
      const existing = collaboratorMap.get(actorSlug);

      collaboratorMap.set(actorSlug, {
        name: actorName,
        slug: actorSlug,
        count: existing ? existing.count + 1 : 1,
      });
    });
  });

  return Array.from(collaboratorMap.values()).sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name)
  );
}

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

function buildDirectorItems(
  directors: Director[],
  label: string,
  subtitle: string
): RelationshipPreviewItem[] {
  return directors.map((director) => ({
    href: `/encyclopedia/directors/${director.slug}`,
    label,
    title: director.name,
    subtitle,
    meta: director.country,
    imageAlt: director.name,
    visualTone: "person",
  }));
}

function buildCollaboratorItems(
  collaborators: CollaboratorItem[]
): RelationshipPreviewItem[] {
  return collaborators.map((actor) => ({
    href: `/encyclopedia/actors/${actor.slug}`,
    label: "Collaborator",
    title: actor.name,
    subtitle: `Appears in ${actor.count} connected film${
      actor.count === 1 ? "" : "s"
    }.`,
    meta: "Actor connection",
    imageAlt: actor.name,
    visualTone: "person",
  }));
}

export default function DirectorDetailPage({
  director,
  directors,
  movies,
}: DirectorDetailPageProps) {
  const directorMedia = director as Director & { profileImage?: EntityImage | null };
  const directorMovies = movies.filter(
    (movie) => movie.directorSlug === director.slug
  );

  const knownForMovies = movies.filter((movie) =>
    director.knownForMovieIds.includes(movie.id)
  );

  const essentialFilms = movies.filter((movie) =>
    (director.essentialMovieIds ?? []).includes(movie.id)
  );

  const starterMovie = movies.find(
    (movie) => movie.id === director.starterMovieId
  );

  const collaborators = buildCollaborators(directorMovies);
  const influencedBy = getDirectorsBySlugs(
    director.influencedByDirectorSlugs,
    directors
  );
  const influenced = getDirectorsBySlugs(
    director.influencedDirectorSlugs,
    directors
  );
  const relatedDirectors = getDirectorsBySlugs(
    director.relatedDirectorSlugs,
    directors
  );

  const mainMovement = directorMovies[0]?.movement;
  const mainMovementSlug = directorMovies[0]?.movementSlug;
  const topCollaborator = collaborators[0];

  const quickFacts: EntityQuickFact[] = [
    {
      label: "Country",
      value: (
        <Link
          href={`/encyclopedia/countries/${director.countrySlug}`}
          className="transition hover:text-white"
        >
          {director.countryFlag} {director.country}
        </Link>
      ),
    },
    {
      label: "Years",
      value: director.deathYear
        ? `${director.birthYear}-${director.deathYear}`
        : `${director.birthYear}-`,
    },
    {
      label: "Known For",
      value: `${knownForMovies.length} film${
        knownForMovies.length === 1 ? "" : "s"
      }`,
    },
    {
      label: "Starter Film",
      value: starterMovie?.title ?? "Not selected",
    },
  ];

  const keySections = (
    <div className="space-y-6">
      <FeatureListPattern
        title="Signature Style"
        description="Concise traits that shape how this director's cinema moves, looks, and feels."
        features={director.signatureStyle ?? director.styleKeywords}
      />

      <FeatureListPattern
        title="Key Themes"
        description="Recurring ideas that connect this director's films into a larger body of work."
        features={director.keyThemes ?? []}
      />

      <RelationshipPreviewPattern
        title="Essential Films"
        description="Representative works appear first. The full filmography remains explorable through the film path."
        items={buildMovieItems(
          essentialFilms.length > 0 ? essentialFilms : knownForMovies,
          "Essential Film",
          "A key entry point into this director's cinema."
        )}
        viewAllHref={`/movies?director=${director.slug}`}
        viewAllLabel="View All Films"
      />
    </div>
  );

  const timeline = (
    <RelationshipPreviewPattern
      title="Filmography Timeline"
      description="A compact chronological preview of this director's connected films."
      items={buildMovieItems(
        [...directorMovies].sort((a, b) => a.year - b.year),
        "Filmography",
        "Continue through this film to understand the director's development."
      )}
      viewAllHref={`/movies?director=${director.slug}`}
      viewAllLabel="Explore Filmography"
    />
  );

  const relatedEntities = (
    <div className="space-y-6">
      <RelationshipPreviewPattern
        title="Frequent Collaborators"
        description="Representative collaborators are previewed first, then fully explorable through Actor pages."
        items={buildCollaboratorItems(collaborators)}
        viewAllHref="/encyclopedia/actors"
        viewAllLabel="Browse Actors"
      />

      <RelationshipPreviewPattern
        title="Influence & Related Directors"
        description="Influence, related style, and cinematic context connect this director to other filmmakers."
        items={[
          ...buildDirectorItems(
            influencedBy,
            "Influenced By",
            "A filmmaker connected through influence and cinematic lineage."
          ),
          ...buildDirectorItems(
            influenced,
            "Influenced",
            "A filmmaker connected through later influence."
          ),
          ...buildDirectorItems(
            relatedDirectors,
            "Related Director",
            "A filmmaker connected through style, period, or context."
          ),
        ]}
        viewAllHref="/encyclopedia/directors"
        viewAllLabel="Browse Directors"
      />

      <EntityStartingPointPattern
        movie={starterMovie}
        reason={director.startingPointReason}
      />
    </div>
  );

  const continueJourneyItems = [
    {
      label: "Films",
      title: `Explore Films by ${director.name}`,
      description: `${directorMovies.length} film${
        directorMovies.length === 1 ? "" : "s"
      } connected to this director.`,
      href: `/movies?director=${director.slug}`,
      level: "primary" as const,
    },
    {
      label: "Country",
      title: `Explore ${director.country} Cinema`,
      description: "Move from one director to a wider national cinema context.",
      href: `/encyclopedia/countries/${director.countrySlug}`,
      level: "secondary" as const,
    },
    {
      label: "Movement",
      title: mainMovement ?? "Explore Movement",
      description: mainMovement
        ? "Continue through the film movement connected to this director."
        : "Movement connection is not available yet.",
      href: mainMovementSlug
        ? `/encyclopedia/movements/${mainMovementSlug}`
        : "/encyclopedia/movements",
      level: "secondary" as const,
      disabled: !mainMovementSlug,
    },
    {
      label: "Collaborator",
      title: topCollaborator
        ? `Explore ${topCollaborator.name}`
        : "Explore Frequent Collaborators",
      description: topCollaborator
        ? "Follow the performance connection from this director's filmography."
        : "Collaborator data is not available yet.",
      href: topCollaborator
        ? `/encyclopedia/actors/${topCollaborator.slug}`
        : "/encyclopedia/actors",
      level: "deep" as const,
      disabled: !topCollaborator,
    },
  ];

  return (
    <EncyclopediaDetailTemplate
      hero={
        <EncyclopediaEntityHero
          eyebrow="Director Encyclopedia"
          title={director.name}
          subtitle={director.nameKo}
          description={director.description}
          entityImage={directorMedia.profileImage}
          imageVariant="portrait"
          meta={[
            { label: "Country", value: director.country },
            {
              label: "Years",
              value: director.deathYear
                ? `${director.birthYear}-${director.deathYear}`
                : `${director.birthYear}-`,
            },
            {
              label: "Known For",
              value: `${knownForMovies.length} film${
                knownForMovies.length === 1 ? "" : "s"
              }`,
            },
            {
              label: "Main Style",
              value: director.styleKeywords[0] ?? "Cinema",
            },
          ]}
          tags={director.styleKeywords}
          visualTone="person"
        />
      }
      quickFacts={<EntityQuickFactsPattern facts={quickFacts} />}
      overview={
        <EntityOverviewPattern
          title="Why This Director Matters"
          description={director.whyMatters ?? director.description}
        />
      }
      keySections={keySections}
      timeline={timeline}
      relatedEntities={relatedEntities}
      continueJourney={
        <EntityContinueJourneyPattern
          description="Continue from this director into films, country context, movements, and collaborators."
          items={continueJourneyItems}
        />
      }
    />
  );
}
