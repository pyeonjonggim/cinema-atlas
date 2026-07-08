export type Country = {
  slug: string;

  name: string;
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

    name: "Korea",
    nameKo: "한국",
    flag: "🇰🇷",
    region: "East Asia",

    representativeEra: "Korean Contemporary Cinema",
    knownFor: "Genre + Social Commentary",

    description:
      "한국영화는 장르적 대중성과 사회적 현실 인식을 결합하며 현대 세계영화에서 강한 존재감을 만들어온 영화 문화이다.",

    whyMatters:
      "한국영화는 계급, 가족, 도시, 폭력, 역사적 기억을 장르영화 안에 녹여내며 21세기 세계영화에서 중요한 흐름을 형성했다.",

    characteristics: [
      "장르적 재미와 사회적 메시지의 결합",
      "가족과 계급 구조에 대한 강한 문제의식",
      "스릴러, 드라마, 블랙코미디의 혼합",
    ],

    themes: ["Class", "Family", "Capitalism", "Urban Life", "Social Anxiety"],

    essentialMovieIds: ["parasite"],
    starterMovieId: "parasite",
    startingPointReason:
      "기생충은 현대 한국영화의 장르 감각, 계급의식, 국제적 영향력을 가장 압축적으로 보여주는 작품이다.",

    directorSlugs: ["bong-joon-ho"],
    movementSlugs: ["korean-contemporary-cinema"],
  },

  {
    slug: "united-states",

    name: "United States",
    nameKo: "미국",
    flag: "🇺🇸",
    region: "North America",

    representativeEra: "New Hollywood",
    knownFor: "Studio System & Genre Cinema",

    description:
      "미국영화는 할리우드 스튜디오 시스템, 장르영화, 뉴 할리우드, 블록버스터를 통해 세계 영화산업과 영화 언어에 큰 영향을 준 영화 문화이다.",

    whyMatters:
      "미국영화는 영화산업의 규모뿐 아니라 장르, 스타 시스템, 작가주의와 상업영화의 관계를 이해하는 데 핵심적인 기준점이다.",

    characteristics: [
      "장르영화와 산업 시스템의 강한 결합",
      "상업영화와 작가주의의 공존",
      "세계 영화시장에 대한 막대한 영향력",
    ],

    themes: ["Power", "Family", "American Myth", "Crime", "Individualism"],

    essentialMovieIds: ["the-godfather"],
    starterMovieId: "the-godfather",
    startingPointReason:
      "대부는 뉴 할리우드 시대와 미국 장르영화의 깊이를 동시에 이해할 수 있는 대표적인 출발점이다.",

    directorSlugs: ["francis-ford-coppola"],
    movementSlugs: ["new-hollywood"],
  },

  {
    slug: "japan",

    name: "Japan",
    nameKo: "일본",
    flag: "🇯🇵",
    region: "East Asia",

    representativeEra: "Japanese Golden Age",
    knownFor: "Humanism & Auteur Cinema",

    description:
      "일본영화는 고전기부터 현대까지 강한 작가주의 전통과 장르적 다양성을 통해 세계 영화사에 깊은 영향을 준 영화 문화이다.",

    whyMatters:
      "일본영화는 구로사와, 오즈, 미조구치 등 거장들을 통해 세계 영화사와 연결되었고, 사무라이 영화, 가족 드라마, 애니메이션 등 다양한 흐름을 형성했다.",

    characteristics: [
      "강한 작가주의 전통",
      "도덕, 가족, 전통과 현대성의 충돌",
      "시각적 형식과 인간주의의 결합",
    ],

    themes: ["Truth", "Morality", "Family", "Tradition", "Modernity"],

    essentialMovieIds: ["rashomon"],
    starterMovieId: "rashomon",
    startingPointReason:
      "라쇼몽은 일본영화가 세계 영화사에 강하게 각인되는 계기가 된 작품이며, 일본 고전영화 입문작으로 적합하다.",

    directorSlugs: ["akira-kurosawa"],
    movementSlugs: ["japanese-golden-age"],
  },
];