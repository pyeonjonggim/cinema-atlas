export type Award = {
  slug: string;

  name: string;
  nameKo: string;

  countrySlug: string;
  foundedYear: number;
  organization: string;

  description: string;
  whyMatters: string;
  overview: string[];

  representativeMovieIds: string[];
  starterMovieId: string;
  startingPointReason: string;

  directorSlugs: string[];

  timeline?: {
    year: number;
    title: string;
    description: string;
  }[];
};

export const awards: Award[] = [
  {
    slug: "academy-best-picture",
    name: "Academy Award for Best Picture",
    nameKo: "Academy Award for Best Picture",
    countrySlug: "united-states",
    foundedYear: 1929,
    organization: "Academy of Motion Picture Arts and Sciences",
    description:
      "The Academy Award for Best Picture is one of the most visible institutional recognitions in American film culture, selecting one film each year as a major industry and cultural marker.",
    whyMatters:
      "Best Picture matters because it shows how American film institutions define prestige, popularity, and cultural memory across different eras.",
    overview: [
      "Connects commercial cinema with critical recognition.",
      "Shows which films the American industry elevates as representative works.",
      "Creates a path from individual films to directors, national cinemas, genres, and movements.",
    ],
    representativeMovieIds: ["parasite", "the-godfather"],
    starterMovieId: "parasite",
    startingPointReason:
      "Parasite is a clear starting point because it expanded the historical range of Best Picture and changed how the award relates to world cinema.",
    directorSlugs: ["bong-joon-ho", "francis-ford-coppola"],
    timeline: [
      {
        year: 1929,
        title: "First Academy Awards",
        description:
          "The Academy Awards begin as an institutional recognition system for the American film industry.",
      },
      {
        year: 1973,
        title: "The Godfather Wins Best Picture",
        description:
          "The Godfather's win recognizes a major New Hollywood work that combines genre cinema with auteur ambition.",
      },
      {
        year: 2020,
        title: "Parasite Wins Best Picture",
        description:
          "Parasite becomes the first non-English-language film to win Best Picture, marking a major historical turn for the award.",
      },
    ],
  },
  {
    slug: "venice-golden-lion",
    name: "Golden Lion",
    nameKo: "Golden Lion",
    countrySlug: "italy",
    foundedYear: 1949,
    organization: "Venice Film Festival",
    description:
      "The Golden Lion is the top prize of the Venice Film Festival and one of the most important international recognitions for artistic achievement in cinema.",
    whyMatters:
      "The Golden Lion matters because it connects national cinemas to the international festival circuit and often helps films enter world cinema history.",
    overview: [
      "Represents festival-centered recognition of film art.",
      "Connects national cinema to global discovery and preservation.",
      "Creates pathways from awarded films to directors, countries, and movements.",
    ],
    representativeMovieIds: ["rashomon"],
    starterMovieId: "rashomon",
    startingPointReason:
      "Rashomon is a strong starting point because its Golden Lion win helped introduce Japanese cinema to a wider international audience.",
    directorSlugs: ["akira-kurosawa"],
    timeline: [
      {
        year: 1949,
        title: "Golden Lion Established",
        description:
          "The Venice Film Festival establishes the Golden Lion as its highest award, strengthening festival-based recognition in world cinema.",
      },
      {
        year: 1951,
        title: "Rashomon Wins Golden Lion",
        description:
          "Rashomon's win becomes a landmark moment in the international discovery of Japanese cinema.",
      },
    ],
  },
];
