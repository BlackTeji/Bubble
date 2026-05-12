CREATE TABLE IF NOT EXISTS analytics_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  event_name VARCHAR(100) NOT NULL,
  metadata   JSONB NOT NULL DEFAULT '{}',
  session_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS learner_state (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  state            VARCHAR(20) NOT NULL DEFAULT 'exploring',
  confidence_score INTEGER NOT NULL DEFAULT 50,
  struggle_count   INTEGER NOT NULL DEFAULT 0,
  hints_used_today INTEGER NOT NULL DEFAULT 0,
  last_hint_at     TIMESTAMPTZ,
  last_struggle_at TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT learner_state_check CHECK (
    state IN ('exploring', 'progressing', 'struggling', 'confident', 'confused', 'disengaged', 'inactive')
  ),
  CONSTRAINT confidence_range CHECK (
    confidence_score BETWEEN 0 AND 100
  )
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);