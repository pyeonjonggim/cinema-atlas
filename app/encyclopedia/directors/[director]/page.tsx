import { notFound } from "next/navigation";

import DirectorDetailPage from "@/components/pages/DirectorDetailPage";
import { directors } from "@/data/directors";
import { listMovies } from "@/lib/catalogQuery";

type DirectorRouteProps = {
  params: Promise<{
    director: string;
  }>;
};

export default async function DirectorRoute({ params }: DirectorRouteProps) {
  const { director: directorSlug } = await params;
  const director = directors.find((item) => item.slug === directorSlug);

  if (!director) {
    notFound();
  }

  return (
    <DirectorDetailPage
      director={director}
      directors={directors}
      movies={listMovies()}
    />
  );
}
