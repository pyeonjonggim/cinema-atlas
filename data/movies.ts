import type { Movie } from "@/types/movie";

export const movies: Movie[] = [
  {
    id: "parasite",
    title: "Parasite",
    originalTitle: "Gisaengchung",
    year: 2019,

    country: "Korea",
    countryIds: ["korea"],
    countrySlug: "korea",
    countryFlag: "KR",
    language: "Korean",

    director: "Bong Joon-ho",
    directorIds: ["bong-joon-ho"],
    directorSlug: "bong-joon-ho",

    actors: ["Song Kang-ho", "Cho Yeo-jeong", "Choi Woo-shik"],
    actorIds: ["song-kang-ho", "cho-yeo-jeong", "choi-woo-shik"],
    actorSlugs: ["song-kang-ho", "cho-yeo-jeong", "choi-woo-shik"],
    cast: [
      {
        actorId: "song-kang-ho",
        character: "Kim Ki-taek",
        billingOrder: 1,
        isLead: true,
      },
      {
        actorId: "cho-yeo-jeong",
        character: "Choi Yeon-gyo",
        billingOrder: 2,
        isLead: true,
      },
      {
        actorId: "choi-woo-shik",
        character: "Kim Ki-woo",
        billingOrder: 3,
        isLead: true,
      },
    ],

    genre: "Drama / Thriller",
    genres: ["Drama", "Thriller", "Black Comedy"],
    movement: "Korean Contemporary Cinema",
    movementIds: ["korean-contemporary-cinema"],
    movementSlug: "korean-contemporary-cinema",

    awards: ["Academy Best Picture"],
    awardIds: ["academy-best-picture"],
    awardSlugs: ["academy-best-picture"],
    awardMentions: [
      {
        awardId: "academy-best-picture",
        title: "Academy Award for Best Picture",
        result: "winner",
        year: 2020,
      },
    ],

    difficulty: "beginner",

    averageRating: 5.0,
    rating: 5.0,
    runtime: 132,

    whyMatters:
      "Parasite connected Korean contemporary cinema to a global audience by turning class, space, family, and genre into one precise cinematic structure.",
    synopsis:
      "A struggling family becomes entangled with a wealthy household, and the relationship between the two homes slowly reveals a sharper social divide.",
    themes: ["Class", "Family", "Space", "Capitalism"],
    style: ["Genre shifts", "Architectural staging", "Dark comedy"],
    historicalContext: [
      "A landmark moment for Korean cinema on the international awards stage.",
      "A modern example of social critique moving through popular genre cinema.",
    ],
    relatedMovieIds: ["the-godfather", "rashomon"],
    recommendedMovieIds: ["rashomon"],

    poster: "",
  },
  {
    id: "the-godfather",
    title: "The Godfather",
    originalTitle: "The Godfather",
    year: 1972,

    country: "United States",
    countryIds: ["united-states"],
    countrySlug: "united-states",
    countryFlag: "US",
    language: "English",

    director: "Francis Ford Coppola",
    directorIds: ["francis-ford-coppola"],
    directorSlug: "francis-ford-coppola",

    actors: ["Marlon Brando", "Al Pacino", "James Caan"],
    actorIds: ["marlon-brando", "al-pacino", "james-caan"],
    actorSlugs: ["marlon-brando", "al-pacino", "james-caan"],
    cast: [
      {
        actorId: "marlon-brando",
        character: "Vito Corleone",
        billingOrder: 1,
        isLead: true,
      },
      {
        actorId: "al-pacino",
        character: "Michael Corleone",
        billingOrder: 2,
        isLead: true,
      },
      {
        actorId: "james-caan",
        character: "Sonny Corleone",
        billingOrder: 3,
        isLead: true,
      },
    ],

    genre: "Crime / Drama",
    genres: ["Crime", "Drama"],
    movement: "New Hollywood",
    movementIds: ["new-hollywood"],
    movementSlug: "new-hollywood",

    awards: ["Academy Best Picture"],
    awardIds: ["academy-best-picture"],
    awardSlugs: ["academy-best-picture"],
    awardMentions: [
      {
        awardId: "academy-best-picture",
        title: "Academy Award for Best Picture",
        result: "winner",
        year: 1973,
      },
    ],

    difficulty: "beginner",

    averageRating: 4.5,
    rating: 4.5,
    runtime: 175,

    whyMatters:
      "The Godfather became a defining New Hollywood work by combining genre storytelling, family tragedy, institutional power, and operatic moral decline.",
    synopsis:
      "A crime family faces succession, loyalty, and violence as its youngest son is drawn into the center of power.",
    themes: ["Family", "Power", "Loyalty", "Corruption"],
    style: ["Operatic drama", "Low-key lighting", "Measured pacing"],
    historicalContext: [
      "A central work in the New Hollywood era.",
      "A major example of American genre cinema becoming auteur-driven drama.",
    ],
    relatedMovieIds: ["parasite", "rashomon"],
    recommendedMovieIds: ["parasite"],

    poster: "",
  },
  {
    id: "rashomon",
    title: "Rashomon",
    originalTitle: "Rashomon",
    year: 1950,

    country: "Japan",
    countryIds: ["japan"],
    countrySlug: "japan",
    countryFlag: "JP",
    language: "Japanese",

    director: "Akira Kurosawa",
    directorIds: ["akira-kurosawa"],
    directorSlug: "akira-kurosawa",

    actors: ["Toshiro Mifune", "Machiko Kyo"],
    actorIds: ["toshiro-mifune", "machiko-kyo"],
    actorSlugs: ["toshiro-mifune", "machiko-kyo"],
    cast: [
      {
        actorId: "toshiro-mifune",
        character: "Tajomaru",
        billingOrder: 1,
        isLead: true,
      },
      {
        actorId: "machiko-kyo",
        character: "Masako Kanazawa",
        billingOrder: 2,
        isLead: true,
      },
    ],

    genre: "Drama / Mystery",
    genres: ["Drama", "Mystery", "Jidaigeki"],
    movement: "Japanese Golden Age",
    movementIds: ["japanese-golden-age"],
    movementSlug: "japanese-golden-age",

    awards: ["Venice Golden Lion"],
    awardIds: ["venice-golden-lion"],
    awardSlugs: ["venice-golden-lion"],
    awardMentions: [
      {
        awardId: "venice-golden-lion",
        title: "Golden Lion",
        result: "winner",
        year: 1951,
      },
    ],

    difficulty: "beginner",

    averageRating: 4.0,
    rating: 4.0,
    runtime: 88,

    whyMatters:
      "Rashomon became a gateway for Japanese cinema internationally and reshaped how film could explore truth, memory, and moral uncertainty.",
    synopsis:
      "After a violent incident in the woods, several conflicting testimonies reveal how unstable truth can become when filtered through human desire.",
    themes: ["Truth", "Memory", "Morality", "Human nature"],
    style: ["Subjective narration", "Expressive movement", "Natural light"],
    historicalContext: [
      "A breakthrough moment for Japanese cinema in global film culture.",
      "A key work in the international recognition of postwar Japanese film.",
    ],
    relatedMovieIds: ["parasite", "the-godfather"],
    recommendedMovieIds: ["the-godfather"],

    poster: "",
  },
];
