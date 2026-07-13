import Image from "next/image";
import Link from "next/link";

import { movies } from "@/data/movies";

import GlobalNavigation from "@/components/navigation/GlobalNavigation";
import EditorialFeature from "@/components/editorial/EditorialFeature";
import AtlasButton from "@/components/ui/AtlasButton";
import AtlasCard from "@/components/ui/AtlasCard";
import DiscoveryShelf from "@/components/discovery/DiscoveryShelf";
import JourneyCard from "@/components/discovery/JourneyCard";
import RecommendationCard from "@/components/discovery/RecommendationCard";
import PageContainer from "@/components/layout/PageContainer";
import UniversalHero from "@/components/layout/UniversalHero";
import RecommendedShelfPattern from "@/components/patterns/RecommendedShelfPattern";

type Movie = (typeof movies)[number];

const becauseYouWatchedMovies = movies.slice(0, 3);
const recentlyAddedMovies = movies.slice(-4);
const heroImage = "/images/home/home-hero-earth-desktop.webp";
const editorialImage = "/images/home/featured-journey-japan-desktop.webp";

const continueJourneyItems = [
  {
    label: "Journey",
    title: "World Cinema Map",
    description: "Begin with countries, directors, movements, and films that connect.",
    href: "/explore",
  },
  {
    label: "Country",
    title: "Japanese Cinema",
    description: "Explore a national cinema through films, filmmakers, and movements.",
    href: "/encyclopedia/countries/japan",
  },
  {
    label: "Director",
    title: "Akira Kurosawa",
    description: "Follow one filmmaker into a wider history of world cinema.",
    href: "/encyclopedia/directors/akira-kurosawa",
  },
];

const recommendedEntries = [
  {
    href: "/encyclopedia/directors/akira-kurosawa",
    title: "Akira Kurosawa",
    type: "Director",
    reason: "A powerful starting point for understanding Japanese cinema and global influence.",
  },
  {
    href: "/encyclopedia/movements/french-new-wave",
    title: "French New Wave",
    type: "Movement",
    reason: "A movement that reshaped film language, authorship, and modern cinema.",
  },
  {
    href: "/encyclopedia/awards/academy-award-best-picture",
    title: "Academy Award for Best Picture",
    type: "Award",
    reason: "A route into how institutions record and shape cinema history.",
  },
];

const featuredJourneys = [
  {
    href: "/explore/journeys",
    category: "Official Journey",
    title: "Introduction to Japanese Cinema",
    subtitle: "Move from postwar humanism to modern global cinema through essential stops.",
    difficulty: "Beginner",
    stops: 5,
    movieCount: 8,
    viewingTime: "12h",
  },
  {
    href: "/explore/journeys",
    category: "Official Journey",
    title: "European New Waves",
    subtitle: "Trace the cinematic experiments that changed how films could think and move.",
    difficulty: "Intermediate",
    stops: 6,
    movieCount: 10,
    viewingTime: "15h",
  },
];

function SlimJourneyCard({
  label,
  title,
  description,
  href,
}: {
  label: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <AtlasCard href={href} className="p-4">
      <div className="flex items-center justify-between gap-5">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
            {label}
          </p>

          <h3 className="mt-1 truncate text-lg font-semibold text-white">
            {title}
          </h3>

          <p className="mt-1 line-clamp-1 text-sm text-neutral-400">
            {description}
          </p>
        </div>

        <span className="shrink-0 text-lg text-neutral-400">-&gt;</span>
      </div>
    </AtlasCard>
  );
}

function MoviePosterCard({ movie }: { movie: Movie }) {
  return (
    <Link href={`/movies/${movie.id}`} className="group min-w-[132px]">
      <div className="aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition group-hover:-translate-y-1 group-hover:border-white/25 group-hover:shadow-xl group-hover:shadow-black/20">
        {movie.poster ? (
          <Image
            src={movie.poster}
            alt={`${movie.title} poster`}
            width={264}
            height={396}
            sizes="132px"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.12),transparent_35%),linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(0,0,0,0.72))]" />
        )}
      </div>

      <p className="mt-3 line-clamp-2 text-sm font-medium text-white">
        {movie.title}
      </p>
      <p className="mt-1 text-xs text-neutral-500">{movie.year}</p>
    </Link>
  );
}

function MovieRowCard({ movie }: { movie: Movie }) {
  return (
    <AtlasCard href={`/movies/${movie.id}`} className="min-w-[260px] p-3">
      <div className="flex items-center gap-3">
        <div className="h-20 w-14 shrink-0 overflow-hidden rounded-xl bg-neutral-800">
          {movie.poster ? (
            <Image
              src={movie.poster}
              alt={`${movie.title} poster`}
              width={112}
              height={160}
              sizes="56px"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.12),transparent_35%),linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(0,0,0,0.72))]" />
          )}
        </div>

        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            Movie
          </p>

          <h3 className="mt-1 line-clamp-1 font-semibold text-white">
            {movie.title}
          </h3>

          <p className="mt-1 text-sm text-neutral-500">{movie.year}</p>
        </div>

        <span className="ml-auto shrink-0 text-neutral-400">-&gt;</span>
      </div>
    </AtlasCard>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--atlas-bg)] text-[var(--atlas-text)]">
      <GlobalNavigation />

      <PageContainer size="wide">
        <div>
          <UniversalHero
            eyebrow="Cinema Atlas"
            title={
              <>
                Travel the World
                <br />
                Through Cinema
              </>
            }
            description="Every Film Opens a New World. Discover films, filmmakers, countries, and movements through connected cinematic journeys."
            backgroundImage={heroImage}
            backgroundAlt="Earth seen from space for the Cinema Atlas Home hero"
            imagePosition="60% center"
            overlayStrength="strong"
            visualTone="world"
            minHeight="landing"
            actions={
              <>
                <AtlasButton href="/explore">Start Exploring</AtlasButton>
                <AtlasButton href="/encyclopedia" variant="secondary">
                  Open Encyclopedia
                </AtlasButton>
              </>
            }
          />

          <AtlasCard className="mt-8 border-white/10 p-6 md:px-8 md:py-6">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--atlas-text-subtle)]">
                Where will cinema take you first?
              </p>
              <h2 className="mt-3 max-w-xl text-3xl font-semibold leading-[1.05] tracking-[-0.01em] text-white">
                Start with a route, not a list.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-400">
                Cinema Atlas connects films to countries, directors, movements,
                awards, and your own record of discovery.
              </p>
            </div>
          </AtlasCard>

          <div style={{ paddingTop: 36 }}>
            <EditorialFeature
              eyebrow="Featured Journey"
              title="Introduction to Japanese Cinema"
              description="A guided path from postwar humanism to modern global cinema."
              image={editorialImage}
              imageAlt="Editorial image representing a Japanese cinema journey"
              imagePosition="55% center"
              metadata={
                <span className="flex flex-wrap items-center gap-2">
                  <span>Beginner</span>
                  <span className="text-white/25">/</span>
                  <span>5 stops</span>
                  <span className="text-white/25">/</span>
                  <span>8 films</span>
                </span>
              }
              action={{
                label: "View Journey",
                href: "/explore/journeys/intro-japanese-cinema",
              }}
              orientation="image-right"
              layout="editorial"
            />
          </div>

          <div style={{ paddingTop: 48 }}>
            <DiscoveryShelf
              title="Continue Your Journey"
              description="Resume a path through connected cinematic knowledge."
              action={
                <AtlasButton href="/explore" variant="ghost">
                  View all
                </AtlasButton>
              }
              columns="three"
            >
              {continueJourneyItems.map((item) => (
                <SlimJourneyCard key={item.title} {...item} />
              ))}
            </DiscoveryShelf>
          </div>

          <div style={{ paddingTop: 40 }}>
            <RecommendedShelfPattern
              title="Recommended For You"
              description="A few meaningful next stops based on Cinema Atlas' exploration model."
              action={
                <AtlasButton href="/encyclopedia" variant="ghost">
                  Browse all
                </AtlasButton>
              }
            >
              {recommendedEntries.map((item) => (
                <RecommendationCard key={item.title} {...item} />
              ))}
            </RecommendedShelfPattern>
          </div>

          <div style={{ paddingTop: 40 }}>
            <DiscoveryShelf
              title="Because You Watched"
              description="Move from one film toward another connected destination."
              action={
                <AtlasButton href="/movies" variant="ghost">
                  View all
                </AtlasButton>
              }
              columns="three"
            >
              <div className="col-span-full flex gap-4 overflow-x-auto pb-2">
                {becauseYouWatchedMovies.map((movie) => (
                  <MovieRowCard key={movie.id} movie={movie} />
                ))}
              </div>
            </DiscoveryShelf>
          </div>

          <div style={{ paddingTop: 40 }}>
            <DiscoveryShelf
              title="Featured Explore"
              description="Curated journeys that help you choose a new direction."
              action={
                <AtlasButton href="/explore" variant="ghost">
                  View all
                </AtlasButton>
              }
              columns="two"
            >
              {featuredJourneys.map((journey) => (
                <JourneyCard key={journey.title} {...journey} />
              ))}
            </DiscoveryShelf>
          </div>

          <div style={{ paddingTop: 40 }}>
            <DiscoveryShelf
              title="Continue Reading"
              description="Return to Encyclopedia entries that deepen the journey."
              action={
                <AtlasButton href="/encyclopedia" variant="ghost">
                  Open Encyclopedia
                </AtlasButton>
              }
              columns="three"
            >
              {[
                {
                  label: "Director",
                  title: "Akira Kurosawa",
                  href: "/encyclopedia/directors/akira-kurosawa",
                },
                {
                  label: "Country",
                  title: "Japan",
                  href: "/encyclopedia/countries/japan",
                },
                {
                  label: "Movement",
                  title: "French New Wave",
                  href: "/encyclopedia/movements/french-new-wave",
                },
              ].map((item) => (
                <SlimJourneyCard
                  key={item.title}
                  label={item.label}
                  title={item.title}
                  description="Open Encyclopedia"
                  href={item.href}
                />
              ))}
            </DiscoveryShelf>
          </div>

          <div style={{ paddingTop: 40 }}>
            <DiscoveryShelf
              title="Passport Progress"
              description="A compact view of where your exploration is starting to take shape."
              action={
                <AtlasButton href="/passport" variant="ghost">
                  View Passport
                </AtlasButton>
              }
              columns="two"
            >
              <div className="col-span-full">
                <AtlasCard className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-neutral-500">
                        Passport Summary
                      </p>

                      <h3 className="mt-1 text-xl font-semibold text-white">
                        Your cinema map is ready to grow.
                      </h3>
                    </div>

                    <p className="max-w-xl text-sm leading-6 text-neutral-400">
                      Passport records challenges, achievements, milestones, and
                      the countries your completed films have opened.
                    </p>
                  </div>
                </AtlasCard>
              </div>
            </DiscoveryShelf>
          </div>

          <div style={{ paddingTop: 40 }}>
            <DiscoveryShelf
              title="Recently Added"
              description="New films available for exploration."
              action={
                <AtlasButton href="/movies" variant="ghost">
                  View Movies
                </AtlasButton>
              }
              columns="four"
            >
              {recentlyAddedMovies.map((movie) => (
                <MoviePosterCard key={movie.id} movie={movie} />
              ))}
            </DiscoveryShelf>
          </div>

          <footer className="border-t border-white/10 py-8 text-sm text-neutral-500">
            Cinema Atlas / Explore / Encyclopedia / Journey / Passport / My Atlas
          </footer>
        </div>
      </PageContainer>
    </main>
  );
}
