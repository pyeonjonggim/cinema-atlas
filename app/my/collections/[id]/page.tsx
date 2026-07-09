import { notFound } from "next/navigation";

import MyCollectionDetailPage from "@/components/pages/MyCollectionDetailPage";
import { collections } from "@/data/collections";
import { journalEntries } from "@/data/journalEntries";
import { movies } from "@/data/movies";
import { userMovies } from "@/data/userMovies";
import { buildCollectionViews } from "@/lib/collections";

type MyCollectionDetailRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MyCollectionDetailRoute({
  params,
}: MyCollectionDetailRouteProps) {
  const { id } = await params;
  const views = buildCollectionViews({
    collections,
    movies,
    userMovies,
    journalEntries,
  });
  const view = views.find((item) => item.collection.id === id);

  if (!view) {
    notFound();
  }

  return <MyCollectionDetailPage view={view} />;
}
