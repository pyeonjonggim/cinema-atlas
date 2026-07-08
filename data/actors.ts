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
    nameKo: "송강호",
    countrySlug: "korea",
    birthYear: 1967,
    description:
      "한국 현대영화를 대표하는 배우 중 한 명으로, 평범한 인물 안에 인간적 복잡성과 사회적 현실감을 담아내는 연기로 알려져 있다.",
    whyMatters:
      "송강호는 한국 현대영화의 세계적 확장 과정에서 중요한 얼굴이 되었으며, 장르영화와 사회적 드라마 사이를 자연스럽게 연결하는 배우이다.",
    screenPersona: [
      "평범하지만 쉽게 규정할 수 없는 인물",
      "희극성과 비극성을 동시에 지닌 얼굴",
      "사회적 현실 속에서 흔들리는 인간적인 존재",
    ],
    keyRoles: [
      "계급 구조 안에서 생존을 모색하는 인물",
      "가족과 사회 사이에서 갈등하는 인물",
      "장르적 긴장 속에서도 인간미를 잃지 않는 인물",
    ],
    essentialMovieIds: ["parasite"],
    starterMovieId: "parasite",
    startingPointReason:
      "기생충은 송강호의 인간적 현실감과 사회적 맥락 속 연기를 이해하기 좋은 출발점이다.",
    frequentDirectorSlugs: ["bong-joon-ho"],
  },
  {
    slug: "cho-yeo-jeong",
    name: "Cho Yeo-jeong",
    nameKo: "조여정",
    countrySlug: "korea",
    birthYear: 1981,
    description:
      "세련된 이미지와 불안정한 감정선을 동시에 표현하며 현대 한국영화 속 계급과 욕망의 얼굴을 보여주는 배우이다.",
    whyMatters:
      "조여정은 기생충을 통해 상류층의 우아함, 무지, 불안을 복합적으로 표현하며 영화의 계급 풍자를 강화한 배우이다.",
    screenPersona: [
      "우아하지만 불안정한 인물",
      "순진함과 특권성을 동시에 가진 얼굴",
      "사회적 거리감을 만들어내는 세련된 이미지",
    ],
    keyRoles: [
      "상류층 공간 안에 놓인 인물",
      "무지와 불안을 동시에 드러내는 인물",
      "계급적 거리감을 상징하는 역할",
    ],
    essentialMovieIds: ["parasite"],
    starterMovieId: "parasite",
    startingPointReason:
      "기생충은 조여정의 스크린 이미지와 계급적 역할을 가장 쉽게 이해할 수 있는 출발점이다.",
    frequentDirectorSlugs: ["bong-joon-ho"],
  },
  {
    slug: "choi-woo-shik",
    name: "Choi Woo-shik",
    nameKo: "최우식",
    countrySlug: "korea",
    birthYear: 1990,
    description:
      "청년 세대의 불안, 어색함, 생존 감각을 자연스럽게 표현하는 한국 현대영화의 배우이다.",
    whyMatters:
      "최우식은 기생충에서 청년 세대의 불안정한 위치와 계급 상승 욕망을 보여주며 영화의 사회적 긴장을 이끄는 중요한 얼굴이다.",
    screenPersona: [
      "불안정한 청년의 얼굴",
      "어색함과 순응성을 가진 인물",
      "사회적 상승 욕망을 품은 인물",
    ],
    keyRoles: [
      "계급 이동을 꿈꾸는 청년",
      "가족과 사회 구조 사이에 놓인 인물",
      "불안정한 현실 속에서 기회를 찾는 인물",
    ],
    essentialMovieIds: ["parasite"],
    starterMovieId: "parasite",
    startingPointReason:
      "기생충은 최우식의 청년성, 불안, 계급 상승 욕망을 이해하기 좋은 출발점이다.",
    frequentDirectorSlugs: ["bong-joon-ho"],
  },
  {
    slug: "marlon-brando",
    name: "Marlon Brando",
    nameKo: "말론 브란도",
    countrySlug: "united-states",
    birthYear: 1924,
    deathYear: 2004,
    description:
      "미국 영화 연기의 흐름을 바꾼 배우로, 내면의 긴장과 자연스러운 신체성을 결합한 연기로 현대 영화 연기에 큰 영향을 주었다.",
    whyMatters:
      "말론 브란도는 고전적 스타 연기에서 현대적 메소드 연기로 넘어가는 중요한 전환점에 있는 배우이다.",
    screenPersona: [
      "권위와 취약성을 동시에 지닌 인물",
      "침묵과 몸짓으로 감정을 전달하는 인물",
      "강한 존재감 뒤에 불안과 피로를 숨긴 인물",
    ],
    keyRoles: [
      "가족과 권력의 중심에 있는 인물",
      "도덕적 모호함을 지닌 권위자",
      "미국적 남성성의 복잡한 얼굴",
    ],
    essentialMovieIds: ["the-godfather"],
    starterMovieId: "the-godfather",
    startingPointReason:
      "대부는 브란도의 권위, 침묵, 신체적 연기가 어떻게 영화 전체의 분위기를 지배하는지 보여주는 대표적인 출발점이다.",
    frequentDirectorSlugs: ["francis-ford-coppola"],
  },
  {
    slug: "al-pacino",
    name: "Al Pacino",
    nameKo: "알 파치노",
    countrySlug: "united-states",
    birthYear: 1940,
    description:
      "내면의 불안과 폭발적인 에너지를 오가는 연기로 미국영화의 권력, 범죄, 남성성을 대표적으로 보여준 배우이다.",
    whyMatters:
      "알 파치노는 뉴 할리우드 시대의 도덕적 모호함과 인물의 내적 붕괴를 강렬하게 체현한 배우이다.",
    screenPersona: [
      "조용한 불안에서 폭발로 나아가는 인물",
      "권력의 중심으로 빨려 들어가는 얼굴",
      "내면의 갈등을 감춘 인물",
    ],
    keyRoles: [
      "가족과 권력 사이에서 변해가는 인물",
      "범죄 세계에 적응하는 인물",
      "도덕적 붕괴를 겪는 인물",
    ],
    essentialMovieIds: ["the-godfather"],
    starterMovieId: "the-godfather",
    startingPointReason:
      "대부는 알 파치노의 절제된 연기와 점진적인 변화를 이해하기 좋은 출발점이다.",
    frequentDirectorSlugs: ["francis-ford-coppola"],
  },
  {
    slug: "james-caan",
    name: "James Caan",
    nameKo: "제임스 칸",
    countrySlug: "united-states",
    birthYear: 1940,
    deathYear: 2022,
    description:
      "강한 육체성과 충동적인 에너지를 바탕으로 미국 장르영화 속 거친 남성성을 보여준 배우이다.",
    whyMatters:
      "제임스 칸은 대부에서 가족, 폭력, 충동성이 결합된 인물을 통해 갱스터 영화의 정서를 강화했다.",
    screenPersona: [
      "거칠고 직접적인 에너지를 가진 인물",
      "충동성과 가족애를 동시에 지닌 인물",
      "폭력적 세계에 자연스럽게 놓인 얼굴",
    ],
    keyRoles: [
      "가족을 위해 폭력적으로 반응하는 인물",
      "권력 구조 안의 행동파 인물",
      "비극적 충동성을 가진 인물",
    ],
    essentialMovieIds: ["the-godfather"],
    starterMovieId: "the-godfather",
    startingPointReason:
      "대부는 제임스 칸의 거친 에너지와 가족 서사 속 역할을 이해하기 좋은 출발점이다.",
    frequentDirectorSlugs: ["francis-ford-coppola"],
  },
  {
    slug: "toshiro-mifune",
    name: "Toshiro Mifune",
    nameKo: "미후네 도시로",
    countrySlug: "japan",
    birthYear: 1920,
    deathYear: 1997,
    description:
      "일본영화 황금기를 대표하는 배우로, 폭발적인 신체성, 강한 에너지, 복잡한 인간성을 통해 세계 영화사에 깊은 인상을 남겼다.",
    whyMatters:
      "미후네 도시로는 구로사와 아키라의 영화 세계를 대표하는 얼굴이자, 사무라이 영화와 일본 고전영화의 국제적 이미지를 형성한 핵심 배우이다.",
    screenPersona: [
      "거칠고 폭발적인 신체성을 가진 인물",
      "영웅성과 불안정성을 동시에 지닌 얼굴",
      "도덕적 혼란 속에서 움직이는 강렬한 존재",
    ],
    keyRoles: [
      "진실과 거짓 사이에서 흔들리는 인물",
      "폭력성과 인간성을 동시에 드러내는 인물",
      "일본 사무라이 영화의 강렬한 신체적 이미지",
    ],
    essentialMovieIds: ["rashomon"],
    starterMovieId: "rashomon",
    startingPointReason:
      "라쇼몽은 미후네 도시로의 폭발적인 연기와 구로사와 영화 속 인간 본성의 모순을 함께 이해할 수 있는 좋은 출발점이다.",
    frequentDirectorSlugs: ["akira-kurosawa"],
  },
  {
    slug: "machiko-kyo",
    name: "Machiko Kyo",
    nameKo: "교 마치코",
    countrySlug: "japan",
    birthYear: 1924,
    deathYear: 2019,
    description:
      "일본 고전영화에서 신비로움, 욕망, 불안, 비극성을 동시에 표현한 배우이다.",
    whyMatters:
      "교 마치코는 라쇼몽에서 진실의 불확실성과 인간 욕망의 복잡함을 드러내며 영화의 핵심 질문을 체현했다.",
    screenPersona: [
      "신비롭고 불안정한 이미지",
      "욕망과 두려움을 동시에 지닌 인물",
      "진실을 단순히 고정할 수 없게 만드는 얼굴",
    ],
    keyRoles: [
      "불확실한 기억 속의 인물",
      "욕망과 피해자성 사이에 놓인 인물",
      "도덕적 판단을 흔드는 역할",
    ],
    essentialMovieIds: ["rashomon"],
    starterMovieId: "rashomon",
    startingPointReason:
      "라쇼몽은 교 마치코의 신비로운 스크린 이미지와 영화의 진실 문제를 함께 이해하기 좋은 출발점이다.",
    frequentDirectorSlugs: ["akira-kurosawa"],
  },
];