export type Actor = {
  slug: string;

  name: string;
  nameKo: string;

  countrySlug: string;

  birthYear: number;
  deathYear?: number;

  description: string;
  whyMatters: string;

  screenPersona: string[];
  keyRoles: string[];

  essentialMovieIds: string[];
  starterMovieId: string;
  startingPointReason: string;

  frequentDirectorSlugs?: string[];
};

export const actors: Actor[] = [
  {
    slug: "song-kang-ho",
    name: "Song Kang-ho",
    nameKo: "Song Kang-ho",
    countrySlug: "korea",
    birthYear: 1967,
    description: "Song Kang-ho is a central performer in contemporary Korean cinema, known for roles that combine ordinary humanity with social tension.",
    whyMatters: "His performances connect genre filmmaking, class stories, and emotional realism across modern Korean cinema.",
    screenPersona: ["Ordinary figures under pressure", "Warmth mixed with uncertainty", "Social realism inside genre cinema"],
    keyRoles: ["Characters navigating family and class pressure", "Figures caught between survival and dignity", "Human presence inside tense genre stories"],
    essentialMovieIds: ["parasite"],
    starterMovieId: "parasite",
    startingPointReason: "Parasite is a clear starting point for understanding his social realism and emotional restraint.",
    frequentDirectorSlugs: ["bong-joon-ho"],
  },
  {
    slug: "cho-yeo-jeong",
    name: "Cho Yeo-jeong",
    nameKo: "Cho Yeo-jeong",
    countrySlug: "korea",
    birthYear: 1981,
    description: "Cho Yeo-jeong brings elegance, unease, and social distance into contemporary Korean screen performance.",
    whyMatters: "Her work in Parasite sharpens the film's class satire through poise, innocence, and anxiety.",
    screenPersona: ["Elegant but unstable presence", "Privilege and innocence in tension", "Polished distance"],
    keyRoles: ["Upper-class domestic spaces", "Characters marked by comfort and vulnerability", "Social distance as performance"],
    essentialMovieIds: ["parasite"],
    starterMovieId: "parasite",
    startingPointReason: "Parasite is the most direct starting point for her role in class satire.",
    frequentDirectorSlugs: ["bong-joon-ho"],
  },
  {
    slug: "choi-woo-shik",
    name: "Choi Woo-shik",
    nameKo: "Choi Woo-shik",
    countrySlug: "korea",
    birthYear: 1990,
    description: "Choi Woo-shik often embodies youthful uncertainty, awkwardness, and survival inside modern Korean stories.",
    whyMatters: "His role in Parasite gives the film a generational perspective on class mobility and instability.",
    screenPersona: ["Uncertain youth", "Awkward adaptability", "Quiet ambition"],
    keyRoles: ["Young characters seeking opportunity", "Figures between family and social structures", "Survival in unstable systems"],
    essentialMovieIds: ["parasite"],
    starterMovieId: "parasite",
    startingPointReason: "Parasite is a clear starting point for his generational role in Korean cinema.",
    frequentDirectorSlugs: ["bong-joon-ho"],
  },
  {
    slug: "marlon-brando",
    name: "Marlon Brando",
    nameKo: "Marlon Brando",
    countrySlug: "united-states",
    birthYear: 1924,
    deathYear: 2004,
    description: "Marlon Brando changed modern screen acting through physical presence, silence, vulnerability, and authority.",
    whyMatters: "He marks a turning point from classical star performance toward modern method-influenced acting.",
    screenPersona: ["Authority and vulnerability", "Emotional weight through gesture", "Power concealing exhaustion"],
    keyRoles: ["Patriarchs and authority figures", "Morally complex men", "Characters shaped by power and family"],
    essentialMovieIds: ["the-godfather"],
    starterMovieId: "the-godfather",
    startingPointReason: "The Godfather is the clearest starting point for his authority, silence, and physical performance.",
    frequentDirectorSlugs: ["francis-ford-coppola"],
  },
  {
    slug: "al-pacino",
    name: "Al Pacino",
    nameKo: "Al Pacino",
    countrySlug: "united-states",
    birthYear: 1940,
    description: "Al Pacino brings internal conflict, intensity, and moral collapse into American crime and power stories.",
    whyMatters: "His New Hollywood performances show how restraint can turn into explosive transformation.",
    screenPersona: ["Quiet anxiety becoming intensity", "Power drawing the character inward", "Conflict hidden beneath control"],
    keyRoles: ["Characters changed by family and power", "Men adapting to criminal worlds", "Moral decline over time"],
    essentialMovieIds: ["the-godfather"],
    starterMovieId: "the-godfather",
    startingPointReason: "The Godfather is a clear starting point for his controlled transformation.",
    frequentDirectorSlugs: ["francis-ford-coppola"],
  },
  {
    slug: "james-caan",
    name: "James Caan",
    nameKo: "James Caan",
    countrySlug: "united-states",
    birthYear: 1940,
    deathYear: 2022,
    description: "James Caan brought physical force, volatility, and direct emotional energy to American genre cinema.",
    whyMatters: "His role in The Godfather strengthens the film's sense of family, violence, and tragic impulse.",
    screenPersona: ["Direct physical energy", "Impulsiveness and loyalty", "A natural fit inside violent worlds"],
    keyRoles: ["Family loyalty expressed through violence", "Action-oriented figures inside power structures", "Tragic volatility"],
    essentialMovieIds: ["the-godfather"],
    starterMovieId: "the-godfather",
    startingPointReason: "The Godfather is the most useful starting point for his screen energy and family role.",
    frequentDirectorSlugs: ["francis-ford-coppola"],
  },
  {
    slug: "toshiro-mifune",
    name: "Toshiro Mifune",
    nameKo: "Toshiro Mifune",
    countrySlug: "japan",
    birthYear: 1920,
    deathYear: 1997,
    description: "Toshiro Mifune is one of the defining faces of classical Japanese cinema, known for explosive physicality and moral intensity.",
    whyMatters: "His performances helped shape the international image of samurai cinema and Kurosawa's film world.",
    screenPersona: ["Explosive physical presence", "Heroism and instability", "Moral force in motion"],
    keyRoles: ["Characters caught between truth and performance", "Violence and humanity in tension", "Iconic samurai imagery"],
    essentialMovieIds: ["rashomon"],
    starterMovieId: "rashomon",
    startingPointReason: "Rashomon is a compact starting point for his intensity and Kurosawa's questions about human nature.",
    frequentDirectorSlugs: ["akira-kurosawa"],
  },
  {
    slug: "machiko-kyo",
    name: "Machiko Kyo",
    nameKo: "Machiko Kyo",
    countrySlug: "japan",
    birthYear: 1924,
    deathYear: 2019,
    description: "Machiko Kyo brought mystery, desire, fear, and ambiguity into classical Japanese cinema.",
    whyMatters: "Her role in Rashomon embodies the film's uncertainty around truth, memory, and human desire.",
    screenPersona: ["Mysterious and unstable image", "Desire and fear in tension", "A face that resists fixed truth"],
    keyRoles: ["Figures inside uncertain memory", "Characters between desire and harm", "Roles that unsettle moral judgment"],
    essentialMovieIds: ["rashomon"],
    starterMovieId: "rashomon",
    startingPointReason: "Rashomon is the best starting point for her screen image and the film's truth problem.",
    frequentDirectorSlugs: ["akira-kurosawa"],
  },
];
