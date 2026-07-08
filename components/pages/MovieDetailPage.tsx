import GlobalNavigation from "../navigation/GlobalNavigation";
import PageContainer from "../layout/PageContainer";
import Section from "../layout/Section";
import MovieHero from "../entity/MovieHero";
import EntityOverviewPattern from "../patterns/EntityOverviewPattern";
import MovieActionBarPattern from "../patterns/MovieActionBarPattern";
import MovieContextPattern from "../patterns/MovieContextPattern";
import MovieQuickFactsPattern from "../patterns/MovieQuickFactsPattern";
import MovieRelatedMoviesPattern from "../patterns/MovieRelatedMoviesPattern";
import RelationshipPreviewPattern, {
  RelationshipPreviewItem,
} from "../patterns/RelationshipPreviewPattern";
import ContinueJourneyPattern from "../patterns/ContinueJourneyPattern";

import type { Actor } from "@/data/actors";
import type { Award } from "@/data/awards";
import type { Country } from "@/data/countries";
import type { Director } from "@/data/directors";
import type { Movement } from "@/data/movements";
import type { Movie } from "@/types/movie";

type MovieDetailPageProps = {
  movie: Movie;
  movies: Movie[];
  directors: Director[];
  countries: Country[];
  movements: Movement[];
  actors: Actor[];
  awards: Award[];
};

function findBySlug<T extends { slug: string }>(items: T[], slug?: string) {
  return items.find((item) => item.slug === slug);
}

function buildCastItems(movie: Movie, actors: Actor[]): RelationshipPreviewItem[] {
  const cast =
    movie.cast?.length
      ? [...movie.cast].sort((a, b) => {
          if (a.isLead !== b.isLead) return a.isLead ? -1 : 1;
          return (a.billingOrder ?? 999) - (b.billingOrder ?? 999);
        })
      : movie.actorSlugs.map((actorId, index) => ({
          actorId,
          character: undefined,
          billingOrder: index + 1,
          isLead: index < 3,
        }));

  return cast.map((member) => {
    const actor = findBySlug(actors, member.actorId);

    return {
      href: `/encyclopedia/actors/${member.actorId}`,
      label: member.isLead ? "Lead Cast" : "Cast",
      title: actor?.name ?? movie.actors[movie.actorSlugs.indexOf(member.actorId)] ?? member.actorId,
      subtitle: member.character,
      meta: member.billingOrder ? `Billing ${member.billingOrder}` : undefined,
    };
  });
}

function buildAwardItems(movie: Movie, awards: Award[]): RelationshipPreviewItem[] {
  const mentions =
    movie.awardMentions?.length
      ? movie.awardMentions
      : movie.awardSlugs.map((awardId, index) => ({
          awardId,
          title: movie.awards[index],
        }));

  return mentions.map((mention) => {
    const award = findBySlug(awards, mention.awardId);
    const result = "result" in mention && mention.result ? mention.result : undefined;
    const year = "year" in mention ? mention.year : undefined;

    return {
      href: `/encyclopedia/awards/${mention.awardId}`,
      label: result ? result.toUpperCase() : "Award",
      title: award?.name ?? mention.title ?? mention.awardId,
      subtitle: award?.organization,
      meta: year ? `${year}` : undefined,
    };
  });
}

function buildConnectedItems(
  movie: Movie,
  directors: Director[],
  countries: Country[],
  movements: Movement[],
  actors: Actor[],
  awards: Award[]
): RelationshipPreviewItem[] {
  const director = findBySlug(directors, movie.directorSlug);
  const country = findBySlug(countries, movie.countrySlug);
  const movement = findBySlug(movements, movie.movementSlug);
  const actor = findBySlug(actors, movie.actorSlugs[0]);
  const award = findBySlug(awards, movie.awardSlugs[0]);

  return [
    {
      href: `/encyclopedia/directors/${movie.directorSlug}`,
      label: "Director",
      title: director?.name ?? movie.director,
      subtitle: "Move from this film to its filmmaker.",
    },
    {
      href: `/encyclopedia/countries/${movie.countrySlug}`,
      label: "Country",
      title: country?.name ?? movie.country,
      subtitle: "Explore the national cinema context.",
    },
    {
      href: `/encyclopedia/movements/${movie.movementSlug}`,
      label: "Movement",
      title: movement?.name ?? movie.movement,
      subtitle: "Understand the cinematic movement around this film.",
    },
    {
      href: `/encyclopedia/actors/${movie.actorSlugs[0]}`,
      label: "Actor",
      title: actor?.name ?? movie.actors[0] ?? "Featured Actor",
      subtitle: "Follow the performance connection.",
    },
    {
      href: `/encyclopedia/awards/${movie.awardSlugs[0]}`,
      label: "Award",
      title: award?.name ?? movie.awards[0] ?? "Award",
      subtitle: "Connect recognition to cinema history.",
    },
  ].filter((item) => !item.href.endsWith("/undefined"));
}

export default function MovieDetailPage({
  movie,
  movies,
  directors,
  countries,
  movements,
  actors,
  awards,
}: MovieDetailPageProps) {
  const connectedItems = buildConnectedItems(
    movie,
    directors,
    countries,
    movements,
    actors,
    awards
  );
  const castItems = buildCastItems(movie, actors);
  const awardItems = buildAwardItems(movie, awards);

  const continueJourneyItems = [
    {
      label: movie.director,
      href: `/encyclopedia/directors/${movie.directorSlug}`,
      description: "Learn how this film fits into the director's wider world.",
      level: "primary" as const,
    },
    {
      label: movie.movement,
      href: `/encyclopedia/movements/${movie.movementSlug}`,
      description: "Continue from one film into its cinematic movement.",
      level: "secondary" as const,
    },
    {
      label: movie.country,
      href: `/encyclopedia/countries/${movie.countrySlug}`,
      description: "Explore the national cinema context behind this work.",
      level: "secondary" as const,
    },
    {
      label: "Japanese Cinema Starter",
      href: "/explore/japanese-cinema-starter",
      description: "Begin a curated journey that turns discovery into learning.",
      level: "deep" as const,
    },
  ];

  return (
    <>
      <GlobalNavigation />

      <PageContainer size="wide">
        <div className="space-y-6">
          <MovieHero movie={movie} />

          <MovieActionBarPattern
            averageRating={movie.rating}
            myRating={movie.myRating}
          />

          <MovieQuickFactsPattern movie={movie} />

          <EntityOverviewPattern
            title="Why This Film Matters"
            description={movie.whyMatters ?? movie.memo}
          />

          <EntityOverviewPattern
            title="Synopsis"
            description={
              movie.synopsis ??
              "A spoiler-free synopsis will be added as this film entry grows."
            }
          />

          <MovieContextPattern
            themes={movie.themes}
            style={movie.style}
            historicalContext={movie.historicalContext}
          />

          <RelationshipPreviewPattern
            title="Connected Encyclopedia"
            description="Each connection opens another part of the cinematic knowledge graph."
            items={connectedItems}
            viewAllHref="/encyclopedia"
            viewAllLabel="Browse Encyclopedia"
            limit={5}
          />

          <RelationshipPreviewPattern
            title="Cast Preview"
            description="Representative cast appears first. The full performance network can expand from here."
            items={castItems}
            viewAllHref="/encyclopedia/actors"
            viewAllLabel="View All Actors"
          />

          <RelationshipPreviewPattern
            title="Awards Preview"
            description="Representative award connections connect recognition to film history."
            items={awardItems}
            viewAllHref="/encyclopedia/awards"
            viewAllLabel="View All Awards"
          />

          <MovieRelatedMoviesPattern movie={movie} movies={movies} />

          <ContinueJourneyPattern items={continueJourneyItems} />

          <Section title="Footer">
            <p className="text-sm text-neutral-500">
              Cinema Atlas turns every film into the beginning of another
              journey.
            </p>
          </Section>
        </div>
      </PageContainer>
    </>
  );
}
