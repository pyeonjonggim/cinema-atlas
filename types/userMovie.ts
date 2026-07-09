export type WatchStatus =
  | "plan"
  | "watching"
  | "completed"
  | "rewatching"
  | "dropped"
  | "paused";

export type UserMovie = {
  movieId: string;
  userId?: string;
  watchStatus?: WatchStatus;
  myRating?: number;
  watchedDate?: string;
  rewatchCount?: number;
  favorite?: boolean;
  journalIds?: string[];
  personalTags?: string[];
  isOwned?: boolean;
  createdAt?: string;
  updatedAt?: string;
};
