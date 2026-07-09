export type JournalMood =
  | "inspired"
  | "moved"
  | "happy"
  | "sad"
  | "confused"
  | "shocked"
  | "thoughtful"
  | "curious"
  | "challenged"
  | "excited"
  | "reflective"
  | "uncertain";

export type JournalVisibility = "private" | "public";
export type JournalKind = "diary" | "study-note";

export type JournalEntry = {
  id: string;
  movieId: string;
  userId?: string;
  date: string;
  title?: string;
  body: string;
  mood?: JournalMood;
  containsSpoilers?: boolean;
  visibility?: JournalVisibility;
  kind?: JournalKind;
  likeCount?: number;
  createdAt?: string;
  updatedAt?: string;
};
