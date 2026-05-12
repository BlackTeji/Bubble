CREATE TABLE IF NOT EXISTS courses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         VARCHAR(100) UNIQUE NOT NULL,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  difficulty   VARCHAR(20) NOT NULL DEFAULT 'beginner',
  order_index  INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS learning_paths (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  slug        VARCHAR(100) NOT NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  UNIQUE(course_id, slug)
);

CREATE TABLE IF NOT EXISTS scenarios (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         VARCHAR(100) UNIQUE NOT NULL,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  difficulty   VARCHAR(20) NOT NULL DEFAULT 'beginner',
  context_json JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lessons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id         UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  scenario_id     UUID REFERENCES scenarios(id),
  slug            VARCHAR(100) NOT NULL,
  title           VARCHAR(255) NOT NULL,
  type            VARCHAR(20) NOT NULL DEFAULT 'concept',
  content_json    JSONB NOT NULL DEFAULT '{}',
  xp_reward       INTEGER NOT NULL DEFAULT 10,
  order_index     INTEGER NOT NULL DEFAULT 0,
  estimated_mins  INTEGER NOT NULL DEFAULT 5,
  UNIQUE(path_id, slug),
  CONSTRAINT lessons_type_check CHECK (
    type IN ('concept', 'quiz', 'challenge', 'playground', 'scenario', 'project')
  )
);

CREATE INDEX IF NOT EXISTS idx_lessons_path_id ON lessons(path_id);
CREATE INDEX IF NOT EXISTS idx_lessons_type ON lessons(type);