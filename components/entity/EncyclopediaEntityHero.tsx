import Image from "next/image";

type EntityHeroMetaItem = {
  label: string;
  value: string | number;
};

type EncyclopediaEntityHeroProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  meta?: EntityHeroMetaItem[];
  tags?: string[];
  visualTone?: "person" | "place" | "movement" | "award" | "movie" | "default";
};

export default function EncyclopediaEntityHero({
  eyebrow,
  title,
  subtitle,
  description,
  image,
  imageAlt,
  meta = [],
  tags = [],
  visualTone = "default",
}: EncyclopediaEntityHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-neutral-950">
      <div className={`absolute inset-0 ${getHeroBackdropClass(visualTone)}`} />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/25" />

      <div className="relative grid gap-5 p-5 md:grid-cols-[132px_1fr] md:p-6 lg:grid-cols-[148px_1fr]">
        <div className="relative w-28 overflow-hidden rounded-2xl border border-white/15 bg-neutral-900 shadow-2xl shadow-black/40 md:w-full">
          {image ? (
            <Image
              src={image}
              alt={imageAlt ?? title}
              width={296}
              height={444}
              sizes="(min-width: 1024px) 148px, (min-width: 768px) 132px, 112px"
              className="aspect-[2/3] h-full w-full object-cover"
              priority
            />
          ) : (
            <div
              className={`aspect-[2/3] h-full w-full ${getPortraitPlaceholderClass(
                visualTone
              )}`}
            />
          )}
        </div>

        <div className="flex min-w-0 flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
            {eyebrow}
          </p>

          <h1 className="mt-2 text-4xl font-semibold leading-tight text-white md:text-5xl">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-2 text-lg text-neutral-400">{subtitle}</p>
          )}

          {meta.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {meta.map((item) => (
                <div
                  key={`${item.label}-${item.value}`}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-neutral-300"
                >
                  <span className="text-neutral-500">{item.label}</span>
                  <span className="mx-2 text-neutral-600">/</span>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {description && (
            <p className="mt-4 max-w-4xl text-base leading-7 text-neutral-300">
              {description}
            </p>
          )}

          {tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/[0.08] px-3 py-1 text-xs font-medium text-neutral-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function getHeroBackdropClass(
  visualTone: EncyclopediaEntityHeroProps["visualTone"]
) {
  const classes = {
    person:
      "bg-[radial-gradient(circle_at_20%_20%,rgba(250,250,250,0.18),transparent_28%),linear-gradient(135deg,rgba(39,39,42,0.9),rgba(10,10,10,1))]",
    place:
      "bg-[radial-gradient(circle_at_25%_18%,rgba(56,189,248,0.2),transparent_30%),linear-gradient(135deg,rgba(24,24,27,0.9),rgba(3,7,18,1))]",
    movement:
      "bg-[radial-gradient(circle_at_25%_18%,rgba(245,158,11,0.22),transparent_30%),linear-gradient(135deg,rgba(41,37,36,0.95),rgba(10,10,10,1))]",
    award:
      "bg-[radial-gradient(circle_at_25%_18%,rgba(250,204,21,0.22),transparent_30%),linear-gradient(135deg,rgba(63,63,70,0.85),rgba(10,10,10,1))]",
    movie:
      "bg-[radial-gradient(circle_at_25%_18%,rgba(248,113,113,0.18),transparent_30%),linear-gradient(135deg,rgba(39,39,42,0.9),rgba(10,10,10,1))]",
    default:
      "bg-[radial-gradient(circle_at_25%_18%,rgba(161,161,170,0.16),transparent_30%),linear-gradient(135deg,rgba(39,39,42,0.9),rgba(10,10,10,1))]",
  };

  return classes[visualTone ?? "default"];
}

function getPortraitPlaceholderClass(
  visualTone: EncyclopediaEntityHeroProps["visualTone"]
) {
  const classes = {
    person:
      "bg-[radial-gradient(circle_at_50%_24%,rgba(250,250,250,0.16),transparent_20%),linear-gradient(160deg,rgba(64,64,64,0.95),rgba(10,10,10,1))]",
    place:
      "bg-[radial-gradient(circle_at_35%_28%,rgba(56,189,248,0.2),transparent_26%),linear-gradient(160deg,rgba(39,39,42,0.95),rgba(10,10,10,1))]",
    movement:
      "bg-[radial-gradient(circle_at_42%_22%,rgba(245,158,11,0.2),transparent_26%),linear-gradient(160deg,rgba(41,37,36,0.95),rgba(10,10,10,1))]",
    award:
      "bg-[radial-gradient(circle_at_50%_22%,rgba(250,204,21,0.24),transparent_24%),linear-gradient(160deg,rgba(63,63,70,0.9),rgba(10,10,10,1))]",
    movie:
      "bg-[radial-gradient(circle_at_42%_22%,rgba(248,113,113,0.18),transparent_26%),linear-gradient(160deg,rgba(39,39,42,0.95),rgba(10,10,10,1))]",
    default:
      "bg-[radial-gradient(circle_at_42%_22%,rgba(161,161,170,0.16),transparent_26%),linear-gradient(160deg,rgba(39,39,42,0.95),rgba(10,10,10,1))]",
  };

  return classes[visualTone ?? "default"];
}
