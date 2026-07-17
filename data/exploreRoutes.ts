export type ExploreStepType =
  | "movie"
  | "director"
  | "country"
  | "movement"
  | "actor"
  | "award";

export type ExploreRouteStep = {
  type: ExploreStepType;
  label: string;
  labelKo?: string;
  slug: string;
  description?: string;
};

export type ExploreRoute = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  goal: string;
  category:
    | "Director Journey"
    | "Country Journey"
    | "Movement Journey"
    | "Actor Journey"
    | "Award Journey"
    | "Hidden Gems"
    | "Deep Dive";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  steps: ExploreRouteStep[];
  nextRouteIds?: string[];
};

export const exploreRoutes: ExploreRoute[] = [
  {
    id: "japanese-cinema-starter",
    title: "Japanese Cinema Starter",
    subtitle: "Begin with Rashomon, Kurosawa, and Japan's global film history.",
    description: "A compact route into Japanese cinema through country, movement, director, actor, and film connections.",
    goal: "Understand how one film opens a wider national cinema path.",
    category: "Country Journey",
    difficulty: "Beginner",
    steps: [
      { type: "country", label: "Japan", labelKo: "Japan", slug: "japan", description: "Explore Japanese cinema as a national film tradition." },
      { type: "movement", label: "Japanese Golden Age", labelKo: "Japanese Golden Age", slug: "japanese-golden-age", description: "Meet the classical era that shaped international views of Japanese cinema." },
      { type: "director", label: "Akira Kurosawa", labelKo: "Akira Kurosawa", slug: "akira-kurosawa", description: "Follow a director whose films shaped world cinema." },
      { type: "actor", label: "Toshiro Mifune", labelKo: "Toshiro Mifune", slug: "toshiro-mifune", description: "See how performance becomes a route through film history." },
      { type: "movie", label: "Rashomon", labelKo: "Rashomon", slug: "rashomon", description: "Start with a film that changed the international life of Japanese cinema." },
    ],
    nextRouteIds: ["venice-golden-lion-route"],
  },
  {
    id: "korean-contemporary-cinema",
    title: "Korean Contemporary Cinema",
    subtitle: "Trace genre craft, class critique, and global recognition.",
    description: "A route from Bong Joon-ho and Parasite into South Korea's contemporary cinema identity.",
    goal: "Understand how contemporary Korean cinema combines popular storytelling and social pressure.",
    category: "Movement Journey",
    difficulty: "Beginner",
    steps: [
      { type: "director", label: "Bong Joon-ho", labelKo: "Bong Joon-ho", slug: "bong-joon-ho", description: "Start with a filmmaker who links genre and social satire." },
      { type: "movie", label: "Parasite", labelKo: "Parasite", slug: "parasite", description: "Watch a global landmark in class satire and genre control." },
      { type: "country", label: "South Korea", labelKo: "South Korea", slug: "korea", description: "Place the film inside a broader national cinema context." },
      { type: "movement", label: "Korean Contemporary Cinema", labelKo: "Korean Contemporary Cinema", slug: "korean-contemporary-cinema", description: "Follow the movement around social pressure and genre precision." },
      { type: "actor", label: "Song Kang-ho", labelKo: "Song Kang-ho", slug: "song-kang-ho", description: "Connect performance to the movement's human realism." },
    ],
    nextRouteIds: ["academy-best-picture-path"],
  },
  {
    id: "new-hollywood-power",
    title: "New Hollywood and Power",
    subtitle: "Move through American genre cinema, family, and institutional power.",
    description: "A route anchored by The Godfather, Coppola, and the New Hollywood period.",
    goal: "Understand how genre cinema carried modern American anxieties.",
    category: "Movement Journey",
    difficulty: "Intermediate",
    steps: [
      { type: "movement", label: "New Hollywood", labelKo: "New Hollywood", slug: "new-hollywood", description: "Begin with a major shift in American film language." },
      { type: "movie", label: "The Godfather", labelKo: "The Godfather", slug: "the-godfather", description: "Study a central work of American crime and family tragedy." },
      { type: "director", label: "Francis Ford Coppola", labelKo: "Francis Ford Coppola", slug: "francis-ford-coppola", description: "Follow the auteur behind the film's tragic scale." },
      { type: "actor", label: "Marlon Brando", labelKo: "Marlon Brando", slug: "marlon-brando", description: "See how performance shapes authority and vulnerability." },
      { type: "country", label: "United States", labelKo: "United States", slug: "united-states", description: "Connect the film to American genre and studio history." },
    ],
    nextRouteIds: ["academy-best-picture-path"],
  },
  {
    id: "academy-best-picture-path",
    title: "Academy Best Picture Path",
    subtitle: "Explore how awards turn films into institutional memory.",
    description: "A route through Best Picture winners, directors, and national cinema context.",
    goal: "Understand awards as a connection between films, institutions, and cultural history.",
    category: "Award Journey",
    difficulty: "Intermediate",
    steps: [
      { type: "award", label: "Academy Award for Best Picture", labelKo: "Academy Award for Best Picture", slug: "academy-best-picture", description: "Start with the institution and its cultural role." },
      { type: "movie", label: "Parasite", labelKo: "Parasite", slug: "parasite", description: "Study a historic expansion of the award's world cinema range." },
      { type: "director", label: "Bong Joon-ho", labelKo: "Bong Joon-ho", slug: "bong-joon-ho", description: "Connect the winning film to its director." },
      { type: "movie", label: "The Godfather", labelKo: "The Godfather", slug: "the-godfather", description: "Compare another landmark Best Picture winner." },
      { type: "director", label: "Francis Ford Coppola", labelKo: "Francis Ford Coppola", slug: "francis-ford-coppola", description: "Follow the institutional recognition of New Hollywood." },
    ],
    nextRouteIds: ["new-hollywood-power"],
  },
  {
    id: "venice-golden-lion-route",
    title: "Venice Golden Lion Route",
    subtitle: "Follow festival recognition into world cinema history.",
    description: "A route from Venice to Rashomon, Kurosawa, and Japanese cinema's international discovery.",
    goal: "Understand how festival recognition can redirect world cinema history.",
    category: "Award Journey",
    difficulty: "Intermediate",
    steps: [
      { type: "country", label: "Italy", labelKo: "Italy", slug: "italy", description: "Start with the country connected to Venice festival culture." },
      { type: "award", label: "Golden Lion", labelKo: "Golden Lion", slug: "venice-golden-lion", description: "Enter the award that connected films to global festival memory." },
      { type: "movie", label: "Rashomon", labelKo: "Rashomon", slug: "rashomon", description: "Follow the film that reshaped international discovery of Japanese cinema." },
      { type: "director", label: "Akira Kurosawa", labelKo: "Akira Kurosawa", slug: "akira-kurosawa", description: "Connect the award to the director's global influence." },
    ],
    nextRouteIds: ["japanese-cinema-starter"],
  },
];
