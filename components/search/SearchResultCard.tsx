import AtlasCard from "@/components/ui/AtlasCard";
import type { UnifiedSearchResult } from "@/lib/search";

const entityLabels: Record<UnifiedSearchResult["entityType"], string> = {
  movie: "MOVIE",
  director: "DIRECTOR",
  actor: "ACTOR",
  country: "COUNTRY",
  movement: "MOVEMENT",
  award: "AWARD",
};

type SearchResultCardProps = {
  result: UnifiedSearchResult;
};

export default function SearchResultCard({ result }: SearchResultCardProps) {
  return (
    <AtlasCard href={result.href} className="p-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold tracking-[0.16em] text-[var(--atlas-accent)]">
            {entityLabels[result.entityType]}
          </span>
          {result.matchedField && (
            <span className="text-xs text-[var(--atlas-text-subtle)]">
              Matched {result.matchedField}
            </span>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold text-[var(--atlas-text)]">
            {result.title}
          </h2>
          {result.subtitle && (
            <p className="mt-1 text-sm text-[var(--atlas-text-muted)]">
              {result.subtitle}
            </p>
          )}
        </div>

        {result.description && (
          <p className="line-clamp-2 text-sm leading-6 text-[var(--atlas-text-muted)]">
            {result.description}
          </p>
        )}
      </div>
    </AtlasCard>
  );
}

