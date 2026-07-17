export function normalizeSearchText(value: string | number | undefined): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeSearchQuery(query: string): string {
  return normalizeSearchText(query).slice(0, 120);
}

export function isSearchableQuery(query: string): boolean {
  const normalized = normalizeSearchQuery(query);
  return normalized.length >= 2;
}

