CREATE TABLE IF NOT EXISTS catalog_movements (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  why_it_matters TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  source_type TEXT NOT NULL DEFAULT 'editorial',
  revision INTEGER NOT NULL DEFAULT 1,
  era_label TEXT,
  start_year INTEGER,
  end_year INTEGER,
  characteristics JSONB NOT NULL DEFAULT '[]'::jsonb,
  themes JSONB NOT NULL DEFAULT '[]'::jsonb,
  starter_movie_slug TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS catalog_movements_status_idx
  ON catalog_movements(status);

CREATE TABLE IF NOT EXISTS catalog_awards (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  why_it_matters TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  source_type TEXT NOT NULL DEFAULT 'editorial',
  revision INTEGER NOT NULL DEFAULT 1,
  organization TEXT,
  award_type TEXT,
  country_slug TEXT,
  founded_year INTEGER,
  overview JSONB NOT NULL DEFAULT '[]'::jsonb,
  starter_movie_slug TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS catalog_awards_status_idx
  ON catalog_awards(status);
