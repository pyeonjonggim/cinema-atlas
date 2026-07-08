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
    nameKo: "봉준호",

    country: "Korea",
    countrySlug: "korea",
    countryFlag: "🇰🇷",

    birthYear: 1969,

    description:
      "장르적 재미와 사회적 풍자를 결합해 현대 한국영화의 세계적 위상을 끌어올린 감독.",

    styleKeywords: ["Class", "Genre Hybrid", "Black Comedy", "Social Satire"],

    knownForMovieIds: ["parasite"],

    whyMatters:
      "봉준호는 대중적인 장르 영화 안에 계급, 가족, 공간, 폭력의 문제를 정교하게 배치하며 한국영화를 세계 영화사의 중요한 지점으로 연결한 감독이다.",

    signatureStyle: [
      "스릴러, 코미디, 드라마가 한 작품 안에서 자연스럽게 뒤섞인다.",
      "공간 구조를 통해 계급과 권력관계를 시각적으로 보여준다.",
      "사회적 메시지를 직접 설명하기보다 장르적 긴장 속에 숨긴다.",
    ],

    keyThemes: ["Class", "Family", "Capitalism", "Space", "Moral Ambiguity"],

    essentialMovieIds: ["parasite"],

    starterMovieId: "parasite",

    startingPointReason:
      "기생충은 봉준호의 장르 감각, 계급의식, 공간 연출, 블랙코미디가 가장 압축적으로 드러나는 작품이기 때문에 좋은 출발점이다.",

    relatedDirectorSlugs: ["francis-ford-coppola", "akira-kurosawa"],
  },

  {
    slug: "francis-ford-coppola",

    name: "Francis Ford Coppola",
    nameKo: "프랜시스 포드 코폴라",

    country: "United States",
    countrySlug: "united-states",
    countryFlag: "🇺🇸",

    birthYear: 1939,

    description:
      "뉴 할리우드 시대를 대표하는 감독 중 한 명으로, 가족, 권력, 미국적 신화를 장대한 서사로 다뤘다.",

    styleKeywords: ["New Hollywood", "Family", "Power", "Operatic Drama"],

    knownForMovieIds: ["the-godfather"],

    whyMatters:
      "코폴라는 1970년대 미국영화가 상업영화와 작가주의를 동시에 성취할 수 있음을 보여준 핵심 감독이다.",

    signatureStyle: [
      "가족 서사를 통해 권력과 폭력의 구조를 보여준다.",
      "고전적 서사와 현대적 비극성을 결합한다.",
      "느린 호흡과 장중한 분위기로 인물의 몰락을 그린다.",
    ],

    keyThemes: ["Family", "Power", "Loyalty", "Corruption", "American Myth"],

    essentialMovieIds: ["the-godfather"],

    starterMovieId: "the-godfather",

    startingPointReason:
      "대부는 코폴라의 세계를 이해하는 가장 중요한 출발점이며, 뉴 할리우드와 갱스터 영화의 기준점이 되는 작품이다.",

    influencedDirectorSlugs: ["bong-joon-ho"],
    relatedDirectorSlugs: ["akira-kurosawa"],
  },

  {
    slug: "akira-kurosawa",

    name: "Akira Kurosawa",
    nameKo: "구로사와 아키라",

    country: "Japan",
    countrySlug: "japan",
    countryFlag: "🇯🇵",

    birthYear: 1910,
    deathYear: 1998,

    description:
      "일본영화를 세계 영화사에 강하게 각인시킨 거장으로, 인간의 도덕성, 진실, 권력, 영웅성을 강렬한 시각적 연출로 탐구했다.",

    styleKeywords: [
      "Humanism",
      "Samurai Cinema",
      "Moral Conflict",
      "Visual Dynamism",
    ],

    knownForMovieIds: ["rashomon"],

    whyMatters:
      "구로사와 아키라는 일본영화가 세계 영화사와 본격적으로 연결되는 데 결정적인 역할을 했으며, 이후 서구 영화감독들에게도 막대한 영향을 준 감독이다.",

    signatureStyle: [
      "강한 움직임, 날씨, 자연 요소를 활용해 감정을 시각화한다.",
      "도덕적 선택과 인간 본성의 모순을 극적으로 다룬다.",
      "동양적 소재와 보편적 서사 구조를 결합한다.",
    ],

    keyThemes: ["Truth", "Morality", "Human Nature", "Justice", "Power"],

    essentialMovieIds: ["rashomon"],

    starterMovieId: "rashomon",

    startingPointReason:
      "라쇼몽은 구로사와 영화의 핵심인 진실의 불확실성, 인간 본성, 강렬한 시각적 연출을 짧고 명확하게 경험할 수 있는 작품이다.",

    influencedDirectorSlugs: ["francis-ford-coppola"],
    relatedDirectorSlugs: ["bong-joon-ho"],
  },
];