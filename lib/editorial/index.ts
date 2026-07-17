export type {
  EditorialEntity,
  EditorialEntityBase,
  MovementEditorialEntity,
  AwardEditorialEntity,
} from "@/lib/editorial/entity";
export type {
  EditorialEntityKind,
  EditorialEntitySourceType,
  EditorialEntityStatus,
  EditorialMetadata,
  EditorialRevisionMetadata,
} from "@/lib/editorial/metadata";
export type {
  EditorialRelationship,
  EditorialRelationshipTargetKind,
  EditorialEntityRelationshipSlugs,
} from "@/lib/editorial/relationships";
export type {
  EditorialProjection,
  EditorialProjectionBase,
  MovementProjection,
  AwardProjection,
} from "@/lib/editorial/projection";
export type {
  AwardRepository,
  EditorialRepository,
  EditorialRepositoryListInput,
  EditorialUpsertInput,
  MovementRepository,
} from "@/lib/editorial/repository";
export { PostgresEditorialRepository } from "@/lib/editorial/postgresEditorialRepository";
export type {
  EditorialProjectionFactory,
  EditorialQueryServicePattern,
} from "@/lib/editorial/query";
export {
  awardEntityToProjection,
  awardSeedToEditorialEntity,
  movementEntityToProjection,
  movementSeedToEditorialEntity,
} from "@/lib/editorial/seedAdapters";
