import { awards } from "../data/awards.ts";
import { movements } from "../data/movements.ts";
import {
  awardSeedToEditorialEntity,
  movementSeedToEditorialEntity,
} from "../lib/editorial/seedAdapters.ts";
import {
  createPool,
  hasDatabaseUrl,
  writePilotArtifact,
  writeSkippedArtifact,
} from "./lib/postgres-pilot-utils.mjs";

function relationType(kind, targetType) {
  if (kind === "movement" && targetType === "movie") return "MOVIE_PART_OF_MOVEMENT";
  if (kind === "award" && targetType === "movie") return "MOVIE_WON_AWARD";
  if (targetType === "person") return "MOVIE_DIRECTED_BY_PERSON";
  if (targetType === "country") return "MOVIE_PRODUCED_IN_COUNTRY";
  return "MOVIE_RELATED_TO_JOURNEY";
}

async function upsertMovement(client, entity) {
  await client.query(
    `INSERT INTO catalog_movements (
      id, slug, name, description, why_it_matters, status, source_type,
      revision, era_label, characteristics, themes, starter_movie_slug,
      created_at, updated_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      why_it_matters = EXCLUDED.why_it_matters,
      status = EXCLUDED.status,
      source_type = EXCLUDED.source_type,
      revision = EXCLUDED.revision,
      era_label = EXCLUDED.era_label,
      characteristics = EXCLUDED.characteristics,
      themes = EXCLUDED.themes,
      starter_movie_slug = EXCLUDED.starter_movie_slug,
      updated_at = EXCLUDED.updated_at`,
    [
      entity.id,
      entity.slug,
      entity.name,
      entity.description,
      entity.whyItMatters,
      entity.status,
      entity.sourceType,
      entity.revision,
      entity.period,
      JSON.stringify(entity.characteristics ?? []),
      JSON.stringify(entity.themes ?? []),
      entity.starterMovieSlug,
      entity.createdAt,
      entity.updatedAt,
    ],
  );
}

async function upsertAward(client, entity) {
  await client.query(
    `INSERT INTO catalog_awards (
      id, slug, name, description, why_it_matters, status, source_type,
      revision, organization, award_type, country_slug, founded_year,
      overview, starter_movie_slug, created_at, updated_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      why_it_matters = EXCLUDED.why_it_matters,
      status = EXCLUDED.status,
      source_type = EXCLUDED.source_type,
      revision = EXCLUDED.revision,
      organization = EXCLUDED.organization,
      award_type = EXCLUDED.award_type,
      country_slug = EXCLUDED.country_slug,
      founded_year = EXCLUDED.founded_year,
      overview = EXCLUDED.overview,
      starter_movie_slug = EXCLUDED.starter_movie_slug,
      updated_at = EXCLUDED.updated_at`,
    [
      entity.id,
      entity.slug,
      entity.name,
      entity.description,
      entity.whyItMatters,
      entity.status,
      entity.sourceType,
      entity.revision,
      entity.organization,
      "Award / Institution",
      entity.countrySlug,
      entity.foundedYear,
      JSON.stringify(entity.overview ?? []),
      entity.starterMovieSlug,
      entity.createdAt,
      entity.updatedAt,
    ],
  );
}

async function replaceRelationships(client, kind, entity) {
  await client.query(
    "DELETE FROM knowledge_graph_edges WHERE source_type = $1 AND source_id = $2 AND is_curated = true",
    [kind, entity.slug],
  );

  const targets = [
    { type: "movie", ids: entity.movieSlugs },
    { type: "person", ids: entity.directorSlugs },
    { type: "country", ids: entity.countrySlugs },
    { type: kind, ids: entity.relatedEntitySlugs },
  ];

  for (const target of targets) {
    for (const targetId of target.ids ?? []) {
      const rel = relationType(kind, target.type);
      await client.query(
        `INSERT INTO knowledge_graph_edges (
          id, source_type, source_id, relation_type, target_type, target_id,
          provenance, confidence, is_curated, created_at, updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (source_type, source_id, relation_type, target_type, target_id) DO UPDATE SET
          provenance = EXCLUDED.provenance,
          confidence = EXCLUDED.confidence,
          is_curated = EXCLUDED.is_curated,
          updated_at = EXCLUDED.updated_at`,
        [
          `${kind}:${entity.slug}:${rel}:${target.type}:${targetId}`,
          kind,
          entity.slug,
          rel,
          target.type,
          targetId,
          JSON.stringify({
            provider: "cinema-atlas-editorial",
            providerRecordId: entity.slug,
            importedAt: entity.updatedAt,
            pipelineVersion: "editorial-persistence-v1",
          }),
          "editorial-confirmed",
          true,
          entity.createdAt,
          entity.updatedAt,
        ],
      );
    }
  }
}

async function counts(client) {
  const movementCount = await client.query("SELECT COUNT(*)::int AS count FROM catalog_movements");
  const awardCount = await client.query("SELECT COUNT(*)::int AS count FROM catalog_awards");
  const edgeCount = await client.query("SELECT COUNT(*)::int AS count FROM knowledge_graph_edges WHERE source_type IN ('movement','award')");
  return {
    catalog_movements: movementCount.rows[0].count,
    catalog_awards: awardCount.rows[0].count,
    editorial_edges: edgeCount.rows[0].count,
  };
}

async function main() {
  if (!hasDatabaseUrl()) {
    await writeSkippedArtifact("editorial-seed-summary.json", "seed:editorial");
    return;
  }

  const movementEntities = movements.map(movementSeedToEditorialEntity);
  const awardEntities = awards.map(awardSeedToEditorialEntity);
  const pool = createPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    for (const entity of movementEntities) {
      await upsertMovement(client, entity);
      await replaceRelationships(client, "movement", entity);
    }
    for (const entity of awardEntities) {
      await upsertAward(client, entity);
      await replaceRelationships(client, "award", entity);
    }
    await client.query("COMMIT");

    const summary = {
      command: "seed:editorial",
      status: "PASS",
      inputMovements: movementEntities.length,
      inputAwards: awardEntities.length,
      counts: await counts(client),
      completedAt: new Date().toISOString(),
    };
    await writePilotArtifact("editorial-seed-summary.json", summary);
    console.table([summary]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
