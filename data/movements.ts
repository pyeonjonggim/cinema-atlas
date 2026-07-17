export type Movement = {
  slug: string;

  name: string;
  nameKo: string;
  period: string;

  description: string;
  whyMatters: string;

  characteristics: string[];
  themes: string[];

  essentialMovieIds: string[];
  starterMovieId: string;
  startingPointReason: string;

  directorSlugs: string[];
  countrySlugs: string[];

  relatedMovementSlugs?: string[];
};

export const movements: Movement[] = [
  {
    slug: "korean-contemporary-cinema",
    name: "Korean Contemporary Cinema",
    nameKo: "Korean Contemporary Cinema",
    period: "1990s-present",
    description:
      "Korean Contemporary Cinema combines genre craft with social observation, turning class, family, urban life, and anxiety into globally resonant stories.",
    whyMatters:
      "This movement matters because it shows how popular cinema can remain formally sharp, emotionally direct, and socially precise.",
    characteristics: [
      "Genre cinema blended with social critique",
      "Sharp attention to class and family structures",
      "Thriller, black comedy, and drama working together",
    ],
    themes: ["Class", "Family", "Capitalism", "Violence", "Social Anxiety"],
    essentialMovieIds: ["parasite"],
    starterMovieId: "parasite",
    startingPointReason:
      "Parasite is the clearest starting point because it condenses the movement's genre precision, class critique, and international impact.",
    directorSlugs: ["bong-joon-ho"],
    countrySlugs: ["korea"],
  },
  {
    slug: "new-hollywood",
    name: "New Hollywood",
    nameKo: "New Hollywood",
    period: "Late 1960s-1980s",
    description:
      "New Hollywood describes the era when American filmmakers brought auteur sensibility, moral ambiguity, and modern social tension into commercial cinema.",
    whyMatters:
      "New Hollywood matters because it reshaped American cinema around personal style, genre revision, institutional distrust, and complex protagonists.",
    characteristics: [
      "Auteur filmmaking inside commercial cinema",
      "Morally ambiguous characters and stories",
      "Critical attention to American power and institutions",
    ],
    themes: ["Power", "Family", "Crime", "Corruption", "American Myth"],
    essentialMovieIds: ["the-godfather"],
    starterMovieId: "the-godfather",
    startingPointReason:
      "The Godfather is a strong starting point because it brings together auteur style, genre storytelling, family tragedy, and political power.",
    directorSlugs: ["francis-ford-coppola"],
    countrySlugs: ["united-states"],
  },
  {
    slug: "japanese-golden-age",
    name: "Japanese Golden Age",
    nameKo: "Japanese Golden Age",
    period: "1940s-1960s",
    description:
      "The Japanese Golden Age gathers the postwar films and filmmakers that helped Japanese cinema become a central part of world film history.",
    whyMatters:
      "This movement matters because it connects humanism, family drama, moral conflict, and formal precision to a broad international film culture.",
    characteristics: [
      "Strong auteur tradition",
      "Moral and humanist inquiry",
      "Tension between tradition and modernity",
    ],
    themes: ["Truth", "Morality", "Family", "Humanism", "Tradition"],
    essentialMovieIds: ["rashomon"],
    starterMovieId: "rashomon",
    startingPointReason:
      "Rashomon is a clear starting point because it shows the movement's international impact and its lasting questions about truth and human nature.",
    directorSlugs: ["akira-kurosawa"],
    countrySlugs: ["japan"],
  },
];
