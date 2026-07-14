CREATE TABLE IF NOT EXISTS catalog_sync_events (
  id TEXT PRIMARY KEY,
  movie_id TEXT,
  event_type TEXT NOT NULL,
  provider TEXT,
  source_record_id TEXT,
  changed_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  added_edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  removed_edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL,
  error_code TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  pipeline_version TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS catalog_sync_events_movie_idx
  ON catalog_sync_events(movie_id);

CREATE INDEX IF NOT EXISTS catalog_sync_events_status_idx
  ON catalog_sync_events(status);
