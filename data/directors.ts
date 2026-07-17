export type Director = {
  slug: string;

  name: string;
  nameKo: string;

  country: string;
  countrySlug: string;
  countryFlag: string;

  birthYear: number;
  deathYear?: number;

  description: string;

  styleKeywords: string[];
  knownForMovieIds: string[];

  whyMatters?: string;
  signatureStyle?: string[];
  keyThemes?: string[];

  essentialMovieIds?: string[];
  starterMovieId?: string;
  startingPointReason?: string;

  influencedByDirectorSlugs?: string[];
  influencedDirectorSlugs?: string[];
  relatedDirectorSlugs?: string[];
};

export const directors: Director[] = [
  {
    slug: "bong-joon-ho",
    name: "Bong Joon-ho",
    nameKo: "Bong Joon-ho",
    country: "South Korea",
    countrySlug: "korea",
    countryFlag: "South Korea",
    birthYear: 1969,
    description: "Bong Joon-ho combines genre pleasure with social satire, connecting Korean cinema to a broad world cinema audience.",
    styleKeywords: ["Genre hybridity", "Social satire", "Spatial storytelling"],
    knownForMovieIds: ["parasite"],
    whyMatters: "His films make class, family, architecture, and violence visible through popular genre forms.",
    signatureStyle: ["Blends thriller, comedy, and drama", "Uses space to reveal class relations", "Places social critique inside genre tension"],
    keyThemes: ["Class", "Family", "Capitalism", "Social Anxiety"],
    essentialMovieIds: ["parasite"],
    starterMovieId: "parasite",
    startingPointReason: "Parasite is the clearest starting point for Bong's genre control, class critique, and spatial design.",
    relatedDirectorSlugs: ["francis-ford-coppola", "akira-kurosawa"],
  },
  {
    slug: "francis-ford-coppola",
    name: "Francis Ford Coppola",
    nameKo: "Francis Ford Coppola",
    country: "United States",
    countrySlug: "united-states",
    countryFlag: "United States",
    birthYear: 1939,
    description: "Francis Ford Coppola is a defining New Hollywood director whose films connect family, power, myth, and American genre cinema.",
    styleKeywords: ["New Hollywood", "Operatic crime drama", "Family and power"],
    knownForMovieIds: ["the-godfather"],
    whyMatters: "Coppola shows how commercial American cinema could carry auteur ambition and tragic scale.",
    signatureStyle: ["Uses family stories to reveal power", "Combines classical narrative with modern tragedy", "Builds slow, heavy atmosphere around decline"],
    keyThemes: ["Power", "Family", "Crime", "American Myth"],
    essentialMovieIds: ["the-godfather"],
    starterMovieId: "the-godfather",
    startingPointReason: "The Godfather is the central starting point for Coppola's world and New Hollywood crime cinema.",
    relatedDirectorSlugs: ["bong-joon-ho", "akira-kurosawa"],
  },
  {
    slug: "akira-kurosawa",
    name: "Akira Kurosawa",
    nameKo: "Akira Kurosawa",
    country: "Japan",
    countrySlug: "japan",
    countryFlag: "Japan",
    birthYear: 1910,
    deathYear: 1998,
    description: "Akira Kurosawa helped connect Japanese cinema to world film history through moral drama, dynamic movement, and powerful visual form.",
    styleKeywords: ["Humanism", "Moral conflict", "Dynamic visual action"],
    knownForMovieIds: ["rashomon"],
    whyMatters: "Kurosawa's films shaped how world cinema thinks about truth, heroism, power, and human contradiction.",
    signatureStyle: ["Uses movement, weather, and landscape to express emotion", "Builds drama from moral choice", "Combines Japanese material with universal story forms"],
    keyThemes: ["Truth", "Morality", "Human Nature", "Power"],
    essentialMovieIds: ["rashomon"],
    starterMovieId: "rashomon",
    startingPointReason: "Rashomon is a compact starting point for Kurosawa's visual force and questions about truth.",
    relatedDirectorSlugs: ["bong-joon-ho", "francis-ford-coppola"],
  },
];
