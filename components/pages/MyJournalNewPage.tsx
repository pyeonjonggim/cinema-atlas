import JournalEditor from "@/components/journal/JournalEditor";
import MyAtlasLayout from "@/components/layout/MyAtlasLayout";
import type { Movie } from "@/types/movie";
import type { UserMovie } from "@/types/userMovie";

type MyJournalNewPageProps = {
  movie?: Movie;
  userMovie?: UserMovie;
};

export default function MyJournalNewPage({
  movie,
  userMovie,
}: MyJournalNewPageProps) {
  return (
    <MyAtlasLayout>
      <JournalEditor movie={movie} userMovie={userMovie} />
    </MyAtlasLayout>
  );
}
