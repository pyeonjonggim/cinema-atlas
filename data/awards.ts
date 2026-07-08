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
    nameKo: "아카데미 작품상",

    countrySlug: "united-states",
    foundedYear: 1929,
    organization: "Academy of Motion Picture Arts and Sciences",

    description:
      "아카데미 작품상은 미국 영화산업을 대표하는 가장 상징적인 영화상 중 하나로, 매년 한 편의 작품을 산업적·문화적 대표작으로 인정한다.",

    whyMatters:
      "아카데미 작품상은 단순한 수상 결과를 넘어, 특정 시대에 어떤 영화가 미국 영화산업과 대중문화 안에서 대표작으로 인정되었는지를 보여주는 제도적 지표이다.",

    overview: [
      "상업영화와 비평적 인정 사이의 관계를 보여준다.",
      "미국 영화산업이 어떤 작품을 시대의 대표작으로 선택했는지 확인할 수 있다.",
      "수상작을 통해 감독, 국가, 장르, 영화사조의 연결을 탐험할 수 있다.",
    ],

    representativeMovieIds: ["parasite", "the-godfather"],
    starterMovieId: "parasite",
    startingPointReason:
      "기생충은 비영어권 영화로서 아카데미 작품상을 수상하며 이 상의 역사적 범위와 세계 영화와의 관계를 새롭게 보여준 대표적인 출발점이다.",

    directorSlugs: ["bong-joon-ho", "francis-ford-coppola"],

    timeline: [
      {
        year: 1929,
        title: "First Academy Awards",
        description:
          "아카데미 시상식이 시작되며 미국 영화산업의 대표적인 제도적 인정 체계가 형성되었다.",
      },
      {
        year: 1973,
        title: "The Godfather Wins Best Picture",
        description:
          "뉴 할리우드의 대표작인 대부가 작품상을 수상하며 장르영화와 작가주의의 결합을 인정받았다.",
      },
      {
        year: 2020,
        title: "Parasite Wins Best Picture",
        description:
          "기생충이 비영어권 영화 최초로 작품상을 수상하며 아카데미의 역사적 전환점을 만들었다.",
      },
    ],
  },

  {
    slug: "venice-golden-lion",

    name: "Golden Lion",
    nameKo: "베니스 황금사자상",

    countrySlug: "italy",
    foundedYear: 1949,
    organization: "Venice Film Festival",

    description:
      "황금사자상은 베니스 영화제의 최고상으로, 세계 영화사에서 예술성과 영화적 성취를 인정하는 대표적인 국제 영화제 상이다.",

    whyMatters:
      "황금사자상은 산업적 성공보다 영화적 형식, 예술성, 국제적 발견의 의미가 강하며, 세계 각국의 영화가 영화사 안에서 인정받는 중요한 통로가 되어왔다.",

    overview: [
      "국제 영화제 중심의 예술영화 인정 체계를 보여준다.",
      "각국의 영화가 세계 영화사와 만나는 중요한 지점이다.",
      "수상작을 통해 작가주의, 국가 영화, 영화사조를 함께 탐험할 수 있다.",
    ],

    representativeMovieIds: ["rashomon"],
    starterMovieId: "rashomon",
    startingPointReason:
      "라쇼몽은 베니스 황금사자상을 통해 일본영화가 세계 영화사에 강하게 각인된 대표적 사례이다.",

    directorSlugs: ["akira-kurosawa"],

    timeline: [
      {
        year: 1949,
        title: "Golden Lion Established",
        description:
          "베니스 영화제의 최고상인 황금사자상이 제도화되며 국제 영화제 중심의 인정 체계가 강화되었다.",
      },
      {
        year: 1951,
        title: "Rashomon Wins Golden Lion",
        description:
          "라쇼몽의 수상은 일본영화가 서구 영화계에 본격적으로 소개되는 중요한 계기가 되었다.",
      },
    ],
  },
];