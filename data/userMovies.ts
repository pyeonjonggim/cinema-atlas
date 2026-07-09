import type { UserMovie } from "@/types/userMovie";

export const userMovies: UserMovie[] = [
  {
    movieId: "parasite",
    watchStatus: "completed",
    myRating: 5,
    watchedDate: "2024-01-01",
    rewatchCount: 0,
    favorite: false,
    journalIds: ["journal-parasite-2024-01-01"],
    personalTags: ["class", "korean-cinema"],
    isOwned: false,
  },
  {
    movieId: "the-godfather",
    watchStatus: "completed",
    myRating: 4.5,
    watchedDate: "2024-01-02",
    rewatchCount: 0,
    favorite: false,
    journalIds: ["journal-the-godfather-2024-01-02"],
    personalTags: ["new-hollywood", "crime"],
    isOwned: false,
  },
  {
    movieId: "rashomon",
    watchStatus: "completed",
    myRating: 4,
    watchedDate: "2024-01-03",
    rewatchCount: 0,
    favorite: false,
    journalIds: ["journal-rashomon-2024-01-03"],
    personalTags: ["japanese-cinema", "truth"],
    isOwned: false,
  },
];
