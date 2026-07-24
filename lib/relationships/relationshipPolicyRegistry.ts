import type { RelationshipPolicy } from "@/types/relationshipPolicy";

export const relationshipGroupRegistry = [
  {
    group: "CONTINUE_WATCHING",
    title: "Continue Watching",
    description: "Move from this entity into directly connected films.",
  },
  {
    group: "EXPLORE_THE_DIRECTOR",
    title: "Explore the Director",
    description: "Follow directing relationships into filmmakers and filmographies.",
  },
  {
    group: "DISCOVER_THE_COUNTRY",
    title: "Discover the Country",
    description: "Continue through national cinema connections.",
  },
  {
    group: "UNDERSTAND_THE_MOVEMENT",
    title: "Understand the Movement",
    description: "Open the editorial movement context connected to this entity.",
  },
  {
    group: "RELATED_PEOPLE",
    title: "Related People",
    description: "Continue through explicitly credited people.",
  },
  {
    group: "HISTORICAL_CONTEXT",
    title: "Historical Context",
    description: "Follow editorial and contextual relationship records.",
  },
  {
    group: "INFLUENCED_BY",
    title: "Influenced By",
    description: "Reserved for explicit influence relationships.",
  },
  {
    group: "SIMILAR_THEMES",
    title: "Similar Themes",
    description: "Reserved for explicit thematic relationships.",
  },
] as const;

const defaultFlags = {
  visibleByDefault: true,
  visibility: "visible" as const,
  supportsContinueJourney: true,
  supportsExplore: true,
  supportsTimeline: false,
  supportsLearningPath: true,
  supportsRecommendation: false,
  supportsSearch: false,
  supportsAtlasGraph: true,
};

export const relationshipPolicyRegistry: RelationshipPolicy[] = [
  {
    relationshipType: "MOVIE_DIRECTED_BY_PERSON",
    category: "PEOPLE",
    priority: 10,
    group: "EXPLORE_THE_DIRECTOR",
    ...defaultFlags,
    metadata: {
      groupTitle: "Explore the Director",
      groupDescription: "Follow directing relationships into filmmakers and filmographies.",
    },
  },
  {
    relationshipType: "MOVIE_ACTED_BY_PERSON",
    category: "PEOPLE",
    priority: 50,
    group: "RELATED_PEOPLE",
    ...defaultFlags,
    metadata: {
      groupTitle: "Related People",
      groupDescription: "Continue through explicitly credited performers.",
    },
  },
  {
    relationshipType: "MOVIE_WRITTEN_BY_PERSON",
    category: "PEOPLE",
    priority: 40,
    group: "RELATED_PEOPLE",
    ...defaultFlags,
    metadata: {
      groupTitle: "Related People",
      groupDescription: "Continue through explicitly credited writers.",
    },
  },
  {
    relationshipType: "MOVIE_PRODUCED_BY_PERSON",
    category: "PRODUCTION",
    priority: 60,
    group: "RELATED_PEOPLE",
    ...defaultFlags,
    metadata: {
      groupTitle: "Related People",
      groupDescription: "Continue through explicitly credited producers.",
    },
  },
  {
    relationshipType: "MOVIE_PRODUCED_IN_COUNTRY",
    category: "PLACES",
    priority: 20,
    group: "DISCOVER_THE_COUNTRY",
    ...defaultFlags,
    metadata: {
      groupTitle: "Discover the Country",
      groupDescription: "Continue through national cinema connections.",
    },
  },
  {
    relationshipType: "MOVIE_HAS_GENRE",
    category: "CULTURE",
    priority: 90,
    group: "SIMILAR_THEMES",
    ...defaultFlags,
    supportsLearningPath: false,
    metadata: {
      groupTitle: "Similar Themes",
      groupDescription: "Follow explicit genre and thematic context.",
    },
  },
  {
    relationshipType: "MOVIE_USES_LANGUAGE",
    category: "CULTURE",
    priority: 80,
    group: "HISTORICAL_CONTEXT",
    ...defaultFlags,
    supportsLearningPath: false,
    metadata: {
      groupTitle: "Historical Context",
      groupDescription: "Follow language and cultural context.",
    },
  },
  {
    relationshipType: "MOVIE_PRODUCED_BY_COMPANY",
    category: "PRODUCTION",
    priority: 70,
    group: "HISTORICAL_CONTEXT",
    ...defaultFlags,
    supportsLearningPath: false,
    metadata: {
      groupTitle: "Historical Context",
      groupDescription: "Follow production context.",
    },
  },
  {
    relationshipType: "MOVIE_PART_OF_MOVEMENT",
    category: "MOVEMENTS",
    priority: 30,
    group: "UNDERSTAND_THE_MOVEMENT",
    ...defaultFlags,
    metadata: {
      groupTitle: "Understand the Movement",
      groupDescription: "Open the editorial movement context connected to this entity.",
    },
  },
  {
    relationshipType: "MOVIE_WON_AWARD",
    category: "AWARDS",
    priority: 75,
    group: "HISTORICAL_CONTEXT",
    ...defaultFlags,
    supportsLearningPath: false,
    metadata: {
      groupTitle: "Historical Context",
      groupDescription: "Follow institutional and award context.",
    },
  },
];
