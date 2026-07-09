export type JournalMood =
  | "moved"
  | "curious"
  | "challenged"
  | "excited"
  | "reflective"
  | "uncertain";

export type JournalEntry = {
  id: string;
  movieId: string;
  userId?: string;
  date: string;
  title?: string;
  body: string;
  mood?: JournalMood;
  containsSpoilers?: boolean;
  createdAt?: string;
  updatedAt?: string;
};
