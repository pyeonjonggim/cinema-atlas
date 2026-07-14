CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS catalog_movies (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE,
  title TEXT NOT NULL,
  original_title TEXT,
  release_date DATE,
  release_year INTEGER,
  runtime INTEGER,
  overview TEXT,
  original_language TEXT,
  poster_path TEXT,
  backdrop_path TEXT,
  external_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  approval_state TEXT NOT NULL,
  approval_reason TEXT,
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  content_quality_score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS catalog_people (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  original_name TEXT,
  birth_date DATE,
  death_date DATE,
  known_for_department TEXT,
  profile_path TEXT,
  roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  approval_state TEXT NOT NULL DEFAULT 'APPROVED',
  provenance JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS catalog_countries (
  id TEXT PRIMARY KEY,
  iso_code TEXT,
  display_name TEXT NOT NULL,
  approval_state TEXT NOT NULL DEFAULT 'APPROVED',
  provenance JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS catalog_genres (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  external_ids JSONB NOT NULL DEFAULT '{}'::jsonb,
  provenance JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS catalog_languages (
  id TEXT PRIMARY KEY,
  iso_code TEXT,
  display_name TEXT NOT NULL,
  native_name TEXT,
  external_ids JSONB NOT NULL DEFAULT '{}'::jsonb,
  provenance JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS catalog_companies (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  origin_country_id TEXT REFERENCES catalog_countries(id),
  logo_path TEXT,
  external_ids JSONB NOT NULL DEFAULT '{}'::jsonb,
  provenance JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS catalog_external_ids (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_entity_id TEXT,
  external_key TEXT NOT NULL,
  external_value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entity_type, provider, external_key, external_value)
);

CREATE UNIQUE INDEX IF NOT EXISTS catalog_external_ids_provider_entity_idx
  ON catalog_external_ids(entity_type, provider, provider_entity_id)
  WHERE provider_entity_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS catalog_external_ids_lookup_idx
  ON catalog_external_ids(entity_type, provider, external_value);

CREATE TABLE IF NOT EXISTS catalog_aliases (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  value TEXT NOT NULL,
  normalized_value TEXT NOT NULL,
  language TEXT,
  script TEXT,
  alias_type TEXT NOT NULL,
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_preferred BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entity_type, entity_id, normalized_value)
);

CREATE INDEX IF NOT EXISTS catalog_aliases_lookup_idx
  ON catalog_aliases(entity_type, normalized_value);

CREATE TABLE IF NOT EXISTS knowledge_graph_edges (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  relation_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence TEXT NOT NULL,
  is_curated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_type, source_id, relation_type, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS knowledge_graph_edges_source_idx
  ON knowledge_graph_edges(source_type, source_id);

CREATE INDEX IF NOT EXISTS knowledge_graph_edges_target_idx
  ON knowledge_graph_edges(target_type, target_id);

CREATE INDEX IF NOT EXISTS knowledge_graph_edges_relation_idx
  ON knowledge_graph_edges(relation_type);

CREATE TABLE IF NOT EXISTS catalog_imports (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  source_record_id TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_code TEXT,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (provider, source_record_id)
);

CREATE TABLE IF NOT EXISTS catalog_review_queue (
  id TEXT PRIMARY KEY,
  review_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  incoming_payload JSONB NOT NULL,
  candidate_payload JSONB,
  reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL,
  resolved_action TEXT,
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS catalog_provenance (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_record_id TEXT,
  imported_at TIMESTAMPTZ NOT NULL,
  pipeline_version TEXT NOT NULL,
  source_payload_hash TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS catalog_provenance_entity_idx
  ON catalog_provenance(entity_type, entity_id);
