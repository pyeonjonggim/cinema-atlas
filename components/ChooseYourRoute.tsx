import Link from "next/link";

type RouteItem = {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
};

type ChooseYourRouteProps = {
  movieTitle: string;

  director: string;
  directorSlug: string;

  country: string;
  countrySlug: string;

  movement: string;
  movementSlug: string;

  mainActor?: string;
  mainActorSlug?: string;

  award?: string;
  awardSlug?: string;
};

export default function ChooseYourRoute({
  movieTitle,
  director,
  directorSlug,
  country,
  countrySlug,
  movement,
  movementSlug,
  mainActor,
  mainActorSlug,
  award,
  awardSlug,
}: ChooseYourRouteProps) {
  const routes: RouteItem[] = [
    {
      icon: "🎥",
      title: "Director Route",
      subtitle: director,
      description: `Continue exploring ${director}'s filmography after ${movieTitle}.`,
      href: `/encyclopedia/directors/${directorSlug}`,
    },
    {
      icon: "🌍",
      title: "Country Route",
      subtitle: country,
      description: `Travel deeper into ${country} cinema.`,
      href: `/encyclopedia/countries/${countrySlug}`,
    },
    {
      icon: "📚",
      title: "Movement Route",
      subtitle: movement,
      description: `Discover more films from ${movement}.`,
      href: `/encyclopedia/movements/${movementSlug}`,
    },
  ];

  if (mainActor && mainActorSlug) {
    routes.push({
      icon: "🎭",
      title: "Actor Route",
      subtitle: mainActor,
      description: "Explore films connected by cast and performance.",
      href: `/encyclopedia/actors/${mainActorSlug}`,
    });
  }

  if (award && awardSlug) {
    routes.push({
      icon: "🏆",
      title: "Awards Route",
      subtitle: award,
      description: "Follow award-winning films and festival history.",
      href: `/encyclopedia/awards/${awardSlug}`,
    });
  }

  return (
    <section className="mt-10">
      <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">
        Continue Journey
      </p>

      <h2 className="mt-2 text-3xl font-bold">🧭 Choose Your Route</h2>

      <p className="mt-3 max-w-2xl text-zinc-400">
        이 영화를 본 뒤, 어떤 방향으로 영화 여행을 이어갈지 선택하세요.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {routes.map((route) => (
          <Link
            key={route.title}
            href={route.href}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition hover:border-zinc-600 hover:bg-zinc-800"
          >
            <p className="text-4xl">{route.icon}</p>

            <h3 className="mt-4 text-2xl font-bold">{route.title}</h3>

            <p className="mt-2 text-lg font-semibold text-zinc-300">
              {route.subtitle}
            </p>

            <p className="mt-3 text-sm leading-6 text-zinc-500">
              {route.description}
            </p>

            <p className="mt-5 text-sm font-semibold text-zinc-400">
              Continue Journey →
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}