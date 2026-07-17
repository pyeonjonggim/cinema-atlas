CREATE TABLE IF NOT EXISTS catalog_sync_jobs (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  last_error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT catalog_sync_jobs_status_check
    CHECK (status IN ('pending', 'running', 'succeeded', 'failed', 'cancelled')),
  CONSTRAINT catalog_sync_jobs_priority_check
    CHECK (priority IN ('low', 'normal', 'high')),
  CONSTRAINT catalog_sync_jobs_attempt_count_check
    CHECK (attempt_count >= 0)
);

CREATE INDEX IF NOT EXISTS catalog_sync_jobs_status_idx
  ON catalog_sync_jobs(status);

CREATE INDEX IF NOT EXISTS catalog_sync_jobs_priority_idx
  ON catalog_sync_jobs(priority);

CREATE INDEX IF NOT EXISTS catalog_sync_jobs_entity_type_idx
  ON catalog_sync_jobs(entity_type);

CREATE INDEX IF NOT EXISTS catalog_sync_jobs_entity_id_idx
  ON catalog_sync_jobs(entity_id);

CREATE INDEX IF NOT EXISTS catalog_sync_jobs_created_at_idx
  ON catalog_sync_jobs(created_at);

CREATE INDEX IF NOT EXISTS catalog_sync_jobs_pending_order_idx
  ON catalog_sync_jobs(status, priority, created_at);

CREATE UNIQUE INDEX IF NOT EXISTS catalog_sync_jobs_active_entity_provider_idx
  ON catalog_sync_jobs(entity_type, entity_id, provider)
  WHERE status IN ('pending', 'running');
