import Link from "next/link";

export type RelatedCountryItem = {
  slug: string;
  name: string;
  nameKo: string;
  flag: string;
  region: string;
  description: string;
};

type RelatedCountriesProps = {
  items: RelatedCountryItem[];
  maxItems?: number;
};

export default function RelatedCountries({
  items,
  maxItems = 5,
}: RelatedCountriesProps) {
  const visibleItems = items.slice(0, maxItems);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="mb-4 text-xl font-semibold text-white">
        Related Countries
      </h2>

      {visibleItems.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleItems.map((country) => (
            <Link
              key={country.slug}
              href={`/encyclopedia/countries/${country.slug}`}
              className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-white/20 hover:bg-white/10"
            >
              <p className="text-2xl">{country.flag}</p>

              <p className="mt-3 font-semibold text-white">{country.name}</p>

              <p className="mt-1 text-sm text-neutral-500">
                {country.nameKo} · {country.region}
              </p>

              <p className="mt-3 line-clamp-2 text-sm leading-6 text-neutral-400">
                {country.description}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-neutral-400">Related countries are not added yet.</p>
      )}
    </section>
  );
}