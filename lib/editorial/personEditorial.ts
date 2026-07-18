import personEditorialData from "@/data/editorial/persons.json";
import type { Country } from "@/data/countries";
import type { PersonEditorial } from "@/types/editorial";

type PersonEditorialData = {
  persons: PersonEditorial[];
};

const editorialData = personEditorialData as PersonEditorialData;
const editorialBySlug = new Map(
  editorialData.persons.map((person) => [person.slug, person]),
);
const editorialByAlias = new Map<string, PersonEditorial>();

for (const person of editorialData.persons) {
  for (const alias of person.aliases ?? []) {
    editorialByAlias.set(alias, person);
  }
}

const countryDisplayBySlug: Record<string, Pick<Country, "name" | "slug" | "flag">> = {
  argentina: { name: "Argentina", slug: "argentina", flag: "🇦🇷" },
  belgium: { name: "Belgium", slug: "belgium", flag: "🇧🇪" },
  brazil: { name: "Brazil", slug: "brazil", flag: "🇧🇷" },
  china: { name: "China", slug: "china", flag: "🇨🇳" },
  france: { name: "France", slug: "france", flag: "🇫🇷" },
  germany: { name: "Germany", slug: "germany", flag: "🇩🇪" },
  "hong-kong": { name: "Hong Kong", slug: "hong-kong", flag: "🇭🇰" },
  iran: { name: "Iran", slug: "iran", flag: "🇮🇷" },
  italy: { name: "Italy", slug: "italy", flag: "🇮🇹" },
  japan: { name: "Japan", slug: "japan", flag: "🇯🇵" },
  korea: { name: "South Korea", slug: "korea", flag: "🇰🇷" },
  mexico: { name: "Mexico", slug: "mexico", flag: "🇲🇽" },
  sweden: { name: "Sweden", slug: "sweden", flag: "🇸🇪" },
  taiwan: { name: "Taiwan", slug: "taiwan", flag: "🇹🇼" },
  "united-kingdom": { name: "United Kingdom", slug: "united-kingdom", flag: "🇬🇧" },
  "united-states": { name: "United States", slug: "united-states", flag: "🇺🇸" },
};

export type MergedPersonEditorial = {
  editorial?: PersonEditorial;
  country?: Pick<Country, "name" | "slug" | "flag">;
};

export function getPersonEditorialBySlug(slug: string): PersonEditorial | undefined {
  return editorialBySlug.get(slug) ?? editorialByAlias.get(slug);
}

export function getPersonEditorialEntries(): PersonEditorial[] {
  return editorialData.persons;
}

export function mergePersonEditorial(slug: string): MergedPersonEditorial {
  const editorial = getPersonEditorialBySlug(slug);
  const country = editorial?.countrySlug
    ? countryDisplayBySlug[editorial.countrySlug]
    : undefined;

  return {
    editorial,
    country,
  };
}

export function isPersonHiddenByEditorial(slug: string): boolean {
  return getPersonEditorialBySlug(slug)?.hidden === true;
}

export function getEditorialCountrySlugs(): string[] {
  return Object.keys(countryDisplayBySlug);
}
