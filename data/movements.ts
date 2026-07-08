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
    nameKo: "한국 현대영화",
    period: "1990s–Present",

    description:
      "한국 현대영화는 장르적 완성도와 사회적 문제의식을 결합하며 세계 영화계에서 강한 존재감을 만들어낸 흐름이다.",

    whyMatters:
      "한국 현대영화는 지역적 현실을 다루면서도 보편적인 계급, 가족, 폭력, 자본주의 문제를 장르영화 안에서 설득력 있게 풀어냈다는 점에서 중요하다.",

    characteristics: [
      "장르영화와 사회비판의 결합",
      "계급과 가족 구조에 대한 날카로운 시선",
      "스릴러, 블랙코미디, 드라마의 혼합",
    ],

    themes: ["Class", "Family", "Capitalism", "Violence", "Social Anxiety"],

    essentialMovieIds: ["parasite"],
    starterMovieId: "parasite",
    startingPointReason:
      "기생충은 한국 현대영화의 장르적 재미, 계급의식, 국제적 영향력을 가장 압축적으로 보여주는 출발점이다.",

    directorSlugs: ["bong-joon-ho"],
    countrySlugs: ["korea"],
  },

  {
    slug: "new-hollywood",

    name: "New Hollywood",
    nameKo: "뉴 할리우드",
    period: "Late 1960s–1980s",

    description:
      "뉴 할리우드는 고전 할리우드 시스템 이후 젊은 감독들이 작가주의적 감각과 상업영화를 결합하며 미국영화를 새롭게 재편한 흐름이다.",

    whyMatters:
      "뉴 할리우드는 상업영화 안에서도 감독의 개성, 사회적 불안, 도덕적 모호함을 강하게 드러낼 수 있음을 보여준 중요한 영화사적 전환점이다.",

    characteristics: [
      "작가주의와 장르영화의 결합",
      "도덕적으로 모호한 인물과 서사",
      "미국 사회와 권력 구조에 대한 비판적 시선",
    ],

    themes: ["Power", "Family", "Crime", "Corruption", "American Myth"],

    essentialMovieIds: ["the-godfather"],
    starterMovieId: "the-godfather",
    startingPointReason:
      "대부는 뉴 할리우드의 작가주의, 장르영화, 가족 서사, 권력의 비극성을 모두 이해할 수 있는 대표적인 출발점이다.",

    directorSlugs: ["francis-ford-coppola"],
    countrySlugs: ["united-states"],
  },

  {
    slug: "japanese-golden-age",

    name: "Japanese Golden Age",
    nameKo: "일본영화 황금기",
    period: "1940s–1960s",

    description:
      "일본영화 황금기는 구로사와, 오즈, 미조구치 등 거장들이 세계 영화사에 깊은 영향을 남긴 시기이다.",

    whyMatters:
      "일본영화 황금기는 일본영화가 세계 영화사와 본격적으로 연결된 시기로, 인간주의, 가족, 진실, 도덕성에 대한 영화적 탐구를 국제적으로 각인시켰다.",

    characteristics: [
      "강한 작가주의 전통",
      "도덕성과 인간 본성에 대한 탐구",
      "전통과 현대성의 충돌",
    ],

    themes: ["Truth", "Morality", "Family", "Humanism", "Tradition"],

    essentialMovieIds: ["rashomon"],
    starterMovieId: "rashomon",
    startingPointReason:
      "라쇼몽은 일본영화 황금기의 국제적 영향력과 인간 본성에 대한 질문을 가장 명확하게 보여주는 작품이다.",

    directorSlugs: ["akira-kurosawa"],
    countrySlugs: ["japan"],
  },
];