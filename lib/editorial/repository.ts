import type { EditorialEntity, EditorialEntityBase } from "@/lib/editorial/entity";
import type { EditorialEntityKind, EditorialEntityStatus } from "@/lib/editorial/metadata";

export type EditorialRepositoryListInput = {
  kind?: EditorialEntityKind;
  status?: EditorialEntityStatus;
};

export type EditorialUpsertInput<TEntity extends EditorialEntityBase = EditorialEntityBase> = TEntity;

export interface EditorialRepository<TEntity extends EditorialEntityBase = EditorialEntity> {
  findAllPublished(input?: Omit<EditorialRepositoryListInput, "status">): Promise<TEntity[]>;
  findBySlug(kind: EditorialEntityKind, slug: string): Promise<TEntity | undefined>;
  exists(kind: EditorialEntityKind, slug: string): Promise<boolean>;
  upsert(entity: EditorialUpsertInput<TEntity>): Promise<TEntity>;
  replaceRelationships(entity: TEntity): Promise<void>;
  delete(kind: EditorialEntityKind, slug: string): Promise<void>;
}

export type MovementRepository = EditorialRepository<Extract<EditorialEntity, { kind: "movement" }>>;

export type AwardRepository = EditorialRepository<Extract<EditorialEntity, { kind: "award" }>>;
