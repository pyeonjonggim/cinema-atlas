import { normalizeSearchText } from "@/lib/search/normalizer";
import type { SearchableField, SearchMatchType } from "@/lib/search/types";

type RankedMatch = {
  score: number;
  matchedField: string;
  matchType: SearchMatchType;
};

const scoreByMatchType: Record<SearchMatchType, number> = {
  exact: 100,
  prefix: 80,
  "word-start": 60,
  substring: 40,
  metadata: 20,
};

function classifyMatch(query: string, value: string, metadata: boolean): SearchMatchType | undefined {
  const normalizedValue = normalizeSearchText(value);
  if (!normalizedValue) return undefined;
  if (normalizedValue === query) return "exact";
  if (normalizedValue.startsWith(query)) return "prefix";
  if (normalizedValue.split(" ").some((word) => word.startsWith(query))) return "word-start";
  if (normalizedValue.includes(query)) return metadata ? "metadata" : "substring";
  return undefined;
}

export function rankSearchableFields(query: string, fields: SearchableField[]): RankedMatch | undefined {
  return fields.reduce<RankedMatch | undefined>((best, field) => {
    const values = Array.isArray(field.value) ? field.value : [field.value];

    for (const rawValue of values) {
      if (rawValue === undefined) continue;
      const matchType = classifyMatch(query, String(rawValue), Boolean(field.metadata));
      if (!matchType) continue;

      const score = scoreByMatchType[matchType];
      if (!best || score > best.score) {
        best = {
          score,
          matchedField: field.field,
          matchType,
        };
      }
    }

    return best;
  }, undefined);
}

