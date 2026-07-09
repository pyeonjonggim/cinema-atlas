import type { Collection } from "@/types/collection";

export const collections: Collection[] = [
  {
    id: "watchlist",
    title: "Watchlist",
    description: "A future journey of films you intend to watch.",
    kind: "system",
    rule: {
      type: "watchStatus",
      value: "plan",
    },
    pinned: true,
  },
  {
    id: "favorites",
    title: "Favorites",
    description: "Films that became personal landmarks in your Atlas.",
    kind: "system",
    rule: {
      type: "favorite",
      value: true,
    },
    pinned: true,
  },
  {
    id: "journaled-movies",
    title: "Journaled Movies",
    description: "Films connected to your written memories.",
    kind: "system",
    rule: {
      type: "journaled",
    },
    pinned: true,
  },
  {
    id: "five-star-movies",
    title: "Five-Star Movies",
    description: "Films you rated at the top of your personal scale.",
    kind: "system",
    rule: {
      type: "ratingAtLeast",
      value: 5,
    },
  },
  {
    id: "rewatch-queue",
    title: "Rewatch Queue",
    description: "Films marked for future return.",
    kind: "system",
    rule: {
      type: "watchStatus",
      value: "rewatching",
    },
  },
  {
    id: "japanese-films",
    title: "Japanese Films",
    description: "A smart collection built from films connected to Japan.",
    kind: "smart",
    rule: {
      type: "country",
      value: "japan",
    },
  },
  {
    id: "academy-best-picture-films",
    title: "Academy Best Picture Films",
    description: "Films connected to the Academy Best Picture path.",
    kind: "smart",
    rule: {
      type: "award",
      value: "academy-best-picture",
    },
  },
  {
    id: "study-notes",
    title: "Study Notes",
    description: "Films connected to journal entries written as study notes.",
    kind: "smart",
    rule: {
      type: "kind",
      value: "study-note",
    },
  },
  {
    id: "rainy-day-movies",
    title: "Rainy Day Movies",
    description: "Quiet films and memories for slower evenings.",
    kind: "user",
    movieIds: ["rashomon", "parasite"],
    pinned: true,
    createdAt: "2024-01-04",
  },
  {
    id: "economics-in-cinema",
    title: "Economics in Cinema",
    description: "Films that made systems, money, and class feel visible.",
    kind: "user",
    movieIds: ["parasite", "the-godfather"],
    createdAt: "2024-01-05",
  },
  {
    id: "movies-that-changed-my-life",
    title: "Movies That Changed My Life",
    description: "Personal landmarks that changed how I think about cinema.",
    kind: "user",
    movieIds: ["parasite"],
    createdAt: "2024-01-06",
  },
];
