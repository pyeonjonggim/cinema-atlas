import personQualityOverrides from "@/data/catalog/person-quality-overrides.json";

type ExcludedActor = {
  name: string;
  reason: string;
  note?: string;
};

type PersonQualityOverrides = {
  excludedActors: ExcludedActor[];
};

const overrides = personQualityOverrides as PersonQualityOverrides;

function normalizePersonName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[.,-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function isActorExcludedFromEncyclopedia(name: string): boolean {
  const normalized = normalizePersonName(name);
  return overrides.excludedActors.some(
    (entry) => normalizePersonName(entry.name) === normalized,
  );
}

export function getActorExclusionReason(name: string): string | undefined {
  const normalized = normalizePersonName(name);
  return overrides.excludedActors.find(
    (entry) => normalizePersonName(entry.name) === normalized,
  )?.reason;
}

export function getPersonQualityOverrides(): PersonQualityOverrides {
  return overrides;
}
