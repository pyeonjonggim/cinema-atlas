export type RelationshipCategory =
  | "PEOPLE"
  | "PLACES"
  | "MOVEMENTS"
  | "HISTORY"
  | "FILMOGRAPHY"
  | "AWARDS"
  | "CULTURE"
  | "INFLUENCE"
  | "PRODUCTION"
  | "CONTEXT";

export type RelationshipVisibility =
  | "visible"
  | "hidden"
  | "internal"
  | "future";

export type RelationshipPriority = number;

export type RelationshipGrouping =
  | "CONTINUE_WATCHING"
  | "EXPLORE_THE_DIRECTOR"
  | "DISCOVER_THE_COUNTRY"
  | "UNDERSTAND_THE_MOVEMENT"
  | "RELATED_PEOPLE"
  | "HISTORICAL_CONTEXT"
  | "INFLUENCED_BY"
  | "SIMILAR_THEMES";

export type RelationshipPolicy = {
  relationshipType: string;
  category: RelationshipCategory;
  priority: RelationshipPriority;
  group: RelationshipGrouping;
  visibility: RelationshipVisibility;
  visibleByDefault: boolean;
  supportsContinueJourney: boolean;
  supportsExplore: boolean;
  supportsTimeline: boolean;
  supportsLearningPath: boolean;
  supportsRecommendation: boolean;
  supportsSearch: boolean;
  supportsAtlasGraph: boolean;
  metadata?: {
    groupTitle?: string;
    groupDescription?: string;
    notes?: string;
  };
};
