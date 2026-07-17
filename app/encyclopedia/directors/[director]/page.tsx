import { notFound } from "next/navigation";

import DirectorDetailPage from "@/components/pages/DirectorDetailPage";
import { getDirectorBySlug, getDirectorFilmography } from "@/lib/catalogQuery";

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

  const movies = await getDirectorFilmography(directorSlug);

  return (
    <DirectorDetailPage
      director={director}
      directors={[director]}
      movies={movies}
    />
  );
}
