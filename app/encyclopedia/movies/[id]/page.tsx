import { redirect } from "next/navigation";

type EncyclopediaMovieDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EncyclopediaMovieDetailPage({
  params,
}: EncyclopediaMovieDetailPageProps) {
  const { id } = await params;

  redirect(`/movies/${id}`);
}