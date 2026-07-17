export type Country = {
  slug: string;

  name: string;
  displayName?: string;
  isoCode?: string;
  nameKo: string;
  flag: string;
  region: string;

  representativeEra: string;
  knownFor: string;

  description: string;
  whyMatters: string;

  characteristics: string[];
  themes: string[];

  essentialMovieIds: string[];
  starterMovieId: string;
  startingPointReason: string;

  directorSlugs: string[];
  movementSlugs: string[];
};

export const countries: Country[] = [
  {
    slug: "korea",
    name: "South Korea",
    displayName: "South Korea",
    isoCode: "KR",
    nameKo: "South Korea",
    flag: "South Korea",
    region: "East Asia",
    representativeEra: "Korean Contemporary Cinema",
    knownFor: "Genre and social commentary",
    description: "South Korean cinema combines genre energy with social observation, class critique, family stories, and contemporary global influence.",
    whyMatters: "South Korea matters because its films show how popular storytelling can carry sharp social critique and emotional force.",
    characteristics: ["Genre and social commentary", "Class and family structures", "Contemporary global reach"],
    themes: ["Class", "Family", "Capitalism", "Urban Life", "Social Anxiety"],
    essentialMovieIds: ["parasite"],
    starterMovieId: "parasite",
    startingPointReason: "Parasite is the clearest starting point for contemporary Korean cinema's genre precision and class critique.",
    directorSlugs: ["bong-joon-ho"],
    movementSlugs: ["korean-contemporary-cinema"],
  },
  {
    slug: "united-states",
    name: "United States",
    displayName: "United States",
    isoCode: "US",
    nameKo: "United States",
    flag: "United States",
    region: "North America",
    representativeEra: "New Hollywood",
    knownFor: "Studio systems and genre cinema",
    description: "American cinema connects studio systems, genre filmmaking, independent film, star culture, and global popular cinema.",
    whyMatters: "The United States is a major cinema anchor because its industry shaped global film language, distribution, and genre culture.",
    characteristics: ["Studio and independent traditions", "Genre cinema", "Global distribution influence"],
    themes: ["Power", "Family", "American Myth", "Crime", "Individualism"],
    essentialMovieIds: ["the-godfather"],
    starterMovieId: "the-godfather",
    startingPointReason: "The Godfather is a clear starting point for New Hollywood, American genre cinema, and family tragedy.",
    directorSlugs: ["francis-ford-coppola"],
    movementSlugs: ["new-hollywood"],
  },
  {
    slug: "japan",
    name: "Japan",
    displayName: "Japan",
    isoCode: "JP",
    nameKo: "Japan",
    flag: "Japan",
    region: "East Asia",
    representativeEra: "Japanese Golden Age",
    knownFor: "Humanism and auteur cinema",
    description: "Japanese cinema connects classical humanism, genre range, formal precision, animation, and major auteur traditions.",
    whyMatters: "Japan matters because its filmmakers shaped how world cinema thinks about truth, morality, family, and visual form.",
    characteristics: ["Strong auteur tradition", "Classical and modern genre range", "Global influence on film language"],
    themes: ["Truth", "Morality", "Family", "Tradition", "Modernity"],
    essentialMovieIds: ["rashomon"],
    starterMovieId: "rashomon",
    startingPointReason: "Rashomon is a clear starting point for Japan's international impact and classical cinema tradition.",
    directorSlugs: ["akira-kurosawa"],
    movementSlugs: ["japanese-golden-age"],
  },
  {
    slug: "italy",
    name: "Italy",
    displayName: "Italy",
    isoCode: "IT",
    nameKo: "Italy",
    flag: "Italy",
    region: "Europe",
    representativeEra: "Italian Cinema",
    knownFor: "Festival culture and auteur cinema",
    description: "Italy connects Cinema Atlas to neorealism, auteur cinema, festival culture, and the international circulation of film history.",
    whyMatters: "Italy matters through its films, directors, and institutions such as the Venice Film Festival.",
    characteristics: ["European auteur and festival cinema", "National cinema and global film history", "Neorealism and modernist influence"],
    themes: ["Festival Culture", "Auteur Cinema", "European Cinema", "Film History"],
    essentialMovieIds: ["rashomon"],
    starterMovieId: "rashomon",
    startingPointReason: "Rashomon is the current catalog's strongest connection to Italy through the Venice Golden Lion.",
    directorSlugs: [],
    movementSlugs: [],
  },
];
