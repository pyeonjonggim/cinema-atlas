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
    subtitle: "Start with Japan’s classical world cinema gateway.",
    description:
      "A compact path into Japanese cinema through country, movement, director, actor, and a landmark film.",
    goal: "Understand the foundations of Japanese cinema through its global breakthrough.",
    category: "Country Journey",
    difficulty: "Beginner",
    nextRouteIds: ["hidden-gems-world-cinema", "academy-best-picture-path"],
    steps: [
      {
        type: "country",
        label: "Japan",
        labelKo: "일본",
        slug: "japan",
        description: "Explore Japanese cinema as a national film tradition.",
      },
      {
        type: "movement",
        label: "Japanese Golden Age",
        labelKo: "일본영화 황금기",
        slug: "japanese-golden-age",
        description:
          "Understand the period that connected Japanese cinema to world film history.",
      },
      {
        type: "director",
        label: "Akira Kurosawa",
        labelKo: "구로사와 아키라",
        slug: "akira-kurosawa",
        description:
          "Follow one of the central filmmakers of Japanese and world cinema.",
      },
      {
        type: "actor",
        label: "Toshiro Mifune",
        labelKo: "미후네 도시로",
        slug: "toshiro-mifune",
        description:
          "Move from Kurosawa’s cinema to the actor who shaped its screen energy.",
      },
      {
        type: "movie",
        label: "Rashomon",
        labelKo: "라쇼몽",
        slug: "rashomon",
        description:
          "Start with the landmark film that introduced Japanese cinema to many international audiences.",
      },
    ],
  },
  {
    id: "bong-to-korean-cinema",
    title: "Bong Joon Ho to Korean Cinema",
    subtitle: "Move from one filmmaker to a wider national cinema.",
    description:
      "Begin with Bong Joon-ho, then expand into Korean contemporary cinema and its social genre tradition.",
    goal: "Discover how one director opens a path into contemporary Korean cinema.",
    category: "Director Journey",
    difficulty: "Beginner",
    nextRouteIds: ["academy-best-picture-path", "new-hollywood-power-path"],
    steps: [
      {
        type: "director",
        label: "Bong Joon-ho",
        labelKo: "봉준호",
        slug: "bong-joon-ho",
        description:
          "Begin with a filmmaker who connects genre cinema with social criticism.",
      },
      {
        type: "movie",
        label: "Parasite",
        labelKo: "기생충",
        slug: "parasite",
        description:
          "Watch how class, family, space, and genre merge into one film.",
      },
      {
        type: "country",
        label: "Korea",
        labelKo: "한국",
        slug: "korea",
        description:
          "Expand from one film into the broader context of Korean cinema.",
      },
      {
        type: "movement",
        label: "Korean Contemporary Cinema",
        labelKo: "한국 현대영화",
        slug: "korean-contemporary-cinema",
        description:
          "Understand the contemporary movement behind Korea’s global film presence.",
      },
      {
        type: "actor",
        label: "Song Kang-ho",
        labelKo: "송강호",
        slug: "song-kang-ho",
        description:
          "Follow the actor whose screen persona anchors much of modern Korean cinema.",
      },
    ],
  },
  {
    id: "new-hollywood-power-path",
    title: "New Hollywood Power Path",
    subtitle: "Family, power, crime, and the American myth.",
    description:
      "A short route into New Hollywood through The Godfather, Coppola, and American cinema.",
    goal: "Understand how New Hollywood reshaped American genre cinema.",
    category: "Movement Journey",
    difficulty: "Beginner",
    nextRouteIds: ["academy-best-picture-path", "bong-to-korean-cinema"],
    steps: [
      {
        type: "movement",
        label: "New Hollywood",
        labelKo: "뉴 할리우드",
        slug: "new-hollywood",
        description:
          "Start with the movement that reshaped American cinema in the late 1960s and 1970s.",
      },
      {
        type: "movie",
        label: "The Godfather",
        labelKo: "대부",
        slug: "the-godfather",
        description:
          "Enter a landmark film about family, power, loyalty, and corruption.",
      },
      {
        type: "director",
        label: "Francis Ford Coppola",
        labelKo: "프랜시스 포드 코폴라",
        slug: "francis-ford-coppola",
        description:
          "Move from the film to the director who shaped one of New Hollywood’s key achievements.",
      },
      {
        type: "actor",
        label: "Marlon Brando",
        labelKo: "말론 브란도",
        slug: "marlon-brando",
        description:
          "Explore the actor whose presence redefined authority and vulnerability on screen.",
      },
      {
        type: "country",
        label: "United States",
        labelKo: "미국",
        slug: "united-states",
        description:
          "Connect this movement back to American cinema and its industry context.",
      },
    ],
  },
  {
    id: "academy-best-picture-path",
    title: "Academy Best Picture Journey",
    subtitle: "Follow institutional recognition through winning films.",
    description:
      "Explore how one award connects films, directors, countries, and cinema history.",
    goal: "Understand how awards shape the canon of cinema history.",
    category: "Award Journey",
    difficulty: "Beginner",
    nextRouteIds: ["bong-to-korean-cinema", "new-hollywood-power-path"],
    steps: [
      {
        type: "award",
        label: "Academy Award for Best Picture",
        labelKo: "아카데미 작품상",
        slug: "academy-best-picture",
        description:
          "Start from one of cinema’s most visible systems of recognition.",
      },
      {
        type: "movie",
        label: "Parasite",
        labelKo: "기생충",
        slug: "parasite",
        description:
          "Explore the film that expanded what Best Picture could represent globally.",
      },
      {
        type: "director",
        label: "Bong Joon-ho",
        labelKo: "봉준호",
        slug: "bong-joon-ho",
        description:
          "Move from the award-winning film to the director’s cinematic world.",
      },
      {
        type: "movie",
        label: "The Godfather",
        labelKo: "대부",
        slug: "the-godfather",
        description:
          "Compare another Best Picture winner from a different historical moment.",
      },
      {
        type: "director",
        label: "Francis Ford Coppola",
        labelKo: "프랜시스 포드 코폴라",
        slug: "francis-ford-coppola",
        description:
          "Follow the award route into New Hollywood authorship and American cinema.",
      },
    ],
  },
  {
    id: "hidden-gems-world-cinema",
    title: "Hidden Gems of World Cinema",
    subtitle: "A placeholder path for less obvious discoveries.",
    description:
      "A future route for discovering lesser-known films across countries, directors, and movements.",
    goal: "Learn to move beyond obvious entry points into world cinema.",
    category: "Hidden Gems",
    difficulty: "Intermediate",
    nextRouteIds: ["japanese-cinema-starter", "academy-best-picture-path"],
    steps: [
      {
        type: "country",
        label: "Japan",
        labelKo: "일본",
        slug: "japan",
        description:
          "Begin with a national cinema that opened many routes into world film history.",
      },
      {
        type: "award",
        label: "Golden Lion",
        labelKo: "베니스 황금사자상",
        slug: "venice-golden-lion",
        description:
          "Follow the festival recognition that helped introduce this cinema internationally.",
      },
      {
        type: "movie",
        label: "Rashomon",
        labelKo: "라쇼몽",
        slug: "rashomon",
        description:
          "Visit the film that became a key international discovery point.",
      },
      {
        type: "director",
        label: "Akira Kurosawa",
        labelKo: "구로사와 아키라",
        slug: "akira-kurosawa",
        description:
          "Continue into the director’s broader film world and influence.",
      },
    ],
  },
];

export const exploreCategories: ExploreRoute["category"][] = [
  "Director Journey",
  "Country Journey",
  "Movement Journey",
  "Actor Journey",
  "Award Journey",
  "Hidden Gems",
  "Deep Dive",
];