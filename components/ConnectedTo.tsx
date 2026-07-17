import Link from "next/link";

type ConnectedToProps = {
  country: string;
  countrySlug: string;
  director: string;
  directorSlug: string;
  movement: string;
  movementSlug: string;
  mainActor?: string;
  mainActorSlug?: string;
  award?: string;
  awardSlug?: string;
};

export default function ConnectedTo({
  country,
  countrySlug,
  director,
  directorSlug,
  movement,
  movementSlug,
  mainActor,
  mainActorSlug,
  award,
  awardSlug,
}: ConnectedToProps) {
  const connections = [
    {
      icon: "C",
      label: "Country",
      title: country,
      href: `/encyclopedia/countries/${countrySlug}`,
    },
    {
      icon: "D",
      label: "Director",
      title: director,
      href: `/encyclopedia/directors/${directorSlug}`,
    },
    {
      icon: "M",
      label: "Movement",
      title: movement,
      href: `/encyclopedia/movements/${movementSlug}`,
    },
    {
      icon: "A",
      label: "Actor",
      title: mainActor ?? "Main Cast",
      href: `/encyclopedia/actors/${mainActorSlug ?? ""}`,
    },
    {
      icon: "W",
      label: "Award",
      title: award ?? "Awards & Festivals",
      href: `/encyclopedia/awards/${awardSlug ?? ""}`,
    },
  ];

  return (
    <section className="mt-10">
      <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">
        Atlas Network
      </p>

      <h2 className="mt-2 text-3xl font-bold">Connected To</h2>

      <p className="mt-3 max-w-2xl text-zinc-400">
        This film connects to countries, directors, actors, and movements inside Cinema Atlas.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {connections.map((connection) => (
          <Link
            key={connection.label}
            href={connection.href}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition hover:border-zinc-600 hover:bg-zinc-800"
          >
            <p className="text-4xl">{connection.icon}</p>

            <p className="mt-4 text-sm text-zinc-500">
              {connection.label}
            </p>

            <h3 className="mt-2 text-2xl font-bold">
              {connection.title}
            </h3>

            <p className="mt-5 text-sm font-semibold text-zinc-400">
              Explore
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}








