import type { AwardProjection, MovementProjection } from "@/lib/editorial/projection";

export interface EditorialQueryServicePattern {
  getMovements(): Promise<MovementProjection[]>;
  getMovementBySlug(slug: string): Promise<MovementProjection | undefined>;
  getAwards(): Promise<AwardProjection[]>;
  getAwardBySlug(slug: string): Promise<AwardProjection | undefined>;
}

export type EditorialProjectionFactory<TEntity, TProjection> = (entity: TEntity) => TProjection;