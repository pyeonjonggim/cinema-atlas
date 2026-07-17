import { notFound } from "next/navigation";

import DirectorDetailPage from "@/components/pages/DirectorDetailPage";
import { getDirectorBySlug, getDirectors, getMovies } from "@/lib/catalogQuery";

type DirectorRouteProps = {
  params: Promise<{
    director: string;
  }>;
};

export default async function DirectorRoute({ params }: DirectorRouteProps) {
  const { director: directorSlug } = await params;
  const director = await getDirectorBySlug(directorSlug);

  if (!director) {
    notFound();
  }

  const directors = await getDirectors();
  const movies = await getMovies();

  return (
    <DirectorDetailPage
      director={director}
      directors={directors}
      movies={movies}
    />
  );
}
