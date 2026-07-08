import type { Movie } from "@/types/movie";

export const movies: Movie[] = [
  {
    id: "parasite",
    title: "기생충",
    originalTitle: "Parasite",
    year: 2019,

    country: "Korea",
    countrySlug: "korea",
    countryFlag: "🇰🇷",

    director: "Bong Joon-ho",
    directorSlug: "bong-joon-ho",

    actors: ["Song Kang-ho", "Cho Yeo-jeong", "Choi Woo-shik"],
    actorSlugs: ["song-kang-ho", "cho-yeo-jeong", "choi-woo-shik"],

    genre: "Drama / Thriller",
    movement: "Korean Contemporary Cinema",
    movementSlug: "korean-contemporary-cinema",

    awards: ["Academy Best Picture"],
    awardSlugs: ["academy-best-picture"],

    difficulty: "beginner",

    rating: 5.0,
    runtime: 132,
    watchedDate: "2024-01-01",

    memo: "계급 구조를 장르적으로 풀어낸 대표적인 현대 한국영화.",

    poster: "/posters/parasite.jpg",
  },
  {
    id: "the-godfather",
    title: "대부",
    originalTitle: "The Godfather",
    year: 1972,

    country: "United States",
    countrySlug: "united-states",
    countryFlag: "🇺🇸",

    director: "Francis Ford Coppola",
    directorSlug: "francis-ford-coppola",

    actors: ["Marlon Brando", "Al Pacino", "James Caan"],
    actorSlugs: ["marlon-brando", "al-pacino", "james-caan"],

    genre: "Crime / Drama",
    movement: "New Hollywood",
    movementSlug: "new-hollywood",

    awards: ["Academy Best Picture"],
    awardSlugs: ["academy-best-picture"],

    difficulty: "beginner",

    rating: 4.5,
    runtime: 175,
    watchedDate: "2024-01-02",

    memo: "뉴 할리우드 시대의 대표작이자 갱스터 영화의 기준점.",

    poster: "/posters/godfather.jpg",
  },
  {
    id: "rashomon",
    title: "라쇼몽",
    originalTitle: "Rashomon",
    year: 1950,

    country: "Japan",
    countrySlug: "japan",
    countryFlag: "🇯🇵",

    director: "Akira Kurosawa",
    directorSlug: "akira-kurosawa",

    actors: ["Toshiro Mifune", "Machiko Kyo"],
    actorSlugs: ["toshiro-mifune", "machiko-kyo"],

    genre: "Drama / Mystery",
    movement: "Japanese Golden Age",
    movementSlug: "japanese-golden-age",

    awards: ["Venice Golden Lion"],
    awardSlugs: ["venice-golden-lion"],

    difficulty: "beginner",

    rating: 4.0,
    runtime: 88,
    watchedDate: "2024-01-03",

    memo: "서구권에 일본영화를 강하게 각인시킨 작품.",

    poster: "/posters/rashomon.jpg",
  },
];