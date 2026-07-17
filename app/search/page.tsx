import GlobalNavigation from "@/components/navigation/GlobalNavigation";
import PageContainer from "@/components/layout/PageContainer";
import EmptyState from "@/components/ui/EmptyState";
import SearchFilters from "@/components/search/SearchFilters";
import SearchInput from "@/components/search/SearchInput";
import SearchResultCard from "@/components/search/SearchResultCard";
import { allEntityTypes, searchCatalog, type SearchEntityType } from "@/lib/search";

type SearchPageProps = {
  searchParams?: Promise<{
    q?: string;
    type?: string;
  }>;
};

function normalizeType(value?: string): "all" | SearchEntityType {
  return allEntityTypes.includes(value as SearchEntityType) ? (value as SearchEntityType) : "all";
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = (params?.q ?? "").trim();
  const selectedType = normalizeType(params?.type);
  const entityTypes = selectedType === "all" ? undefined : [selectedType];
  const results = await searchCatalog(query, { entityTypes });
  const hasQuery = query.length > 0;

  return (
    <>
      <GlobalNavigation />

      <PageContainer size="wide">
        <div className="space-y-8">
          <section className="space-y-5">
            <div>
              <p className="text-sm font-semibold tracking-[0.16em] text-[var(--atlas-accent)]">
                SEARCH RESULTS
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-[var(--atlas-text)] md:text-4xl">
                {hasQuery ? `Results for "${query}"` : "Search Cinema Atlas"}
              </h1>
            </div>

            <SearchInput initialQuery={query} selectedType={selectedType} />
            <SearchFilters query={query} selectedType={selectedType} />
          </section>

          <section className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <p className="text-sm font-semibold text-[var(--atlas-text-muted)]">
                {hasQuery
                  ? `${results.length} result${results.length === 1 ? "" : "s"}`
                  : "Start with a title, name, country, movement, or award."}
              </p>
            </div>

            {!hasQuery && (
              <EmptyState
                title="Start exploring Cinema Atlas."
                description="Search for a movie, filmmaker, performer, country, movement, or award."
              />
            )}

            {hasQuery && results.length === 0 && (
              <EmptyState
                preset="search"
                title={`No results found for "${query}".`}
                description="Try a different title, name, country, movement, or award."
              />
            )}

            {results.length > 0 && (
              <div className="grid gap-4">
                {results.map((result) => (
                  <SearchResultCard key={`${result.entityType}:${result.slug}`} result={result} />
                ))}
              </div>
            )}
          </section>
        </div>
      </PageContainer>
    </>
  );
}
