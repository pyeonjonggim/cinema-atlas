import type {
  RelationshipEdge,
  RelationshipEntityReference,
  RelationshipEntityType,
} from "@/types/relationship";
import type { RelationshipGrouping } from "@/types/relationshipPolicy";

export type JourneyExplanationKind =
  | "DIRECT_RELATIONSHIP"
  | "INVERSE_RELATIONSHIP"
  | "EDITORIAL_CONTEXT";

export type JourneyExplanationEntity = {
  id: string;
  entityType: RelationshipEntityType;
  label?: string;
};

export type JourneyExplanation = {
  kind: JourneyExplanationKind;
  relationshipType: string;
  source: JourneyExplanationEntity;
  target: JourneyExplanationEntity;
  metadata?: Record<string, unknown>;
};

export type ContinueJourneyCategory = RelationshipGrouping;

export type ContinueJourneyItem = {
  id: string;
  entityType: RelationshipEntityType;
  entityId: string;
  relationshipType: string;
  title: string;
  subtitle?: string;
  explanation: JourneyExplanation;
  priority: number;
  category: ContinueJourneyCategory;
  metadata?: {
    direction: "outgoing" | "incoming";
    sourceEntity: RelationshipEntityReference;
    targetEntity: RelationshipEntityReference;
    relationshipClass?: string;
    provenanceSource?: string;
    relationship?: RelationshipEdge;
  };
};

export type ContinueJourneyGroup = {
  id: ContinueJourneyCategory;
  title: string;
  description: string;
  priority: number;
  items: ContinueJourneyItem[];
};

export type ContinueJourneyResult = {
  source: RelationshipEntityReference;
  supported: boolean;
  groups: ContinueJourneyGroup[];
  items: ContinueJourneyItem[];
  generatedAt: string;
  warnings: string[];
};

export type ContinueJourneyOptions = {
  preferredRelationshipTypes?: string[];
  entityFilters?: RelationshipEntityType[];
  excludeEntityIds?: string[];
  maximumResults?: number;
  includeMetadata?: boolean;
  groupResults?: boolean;
};
