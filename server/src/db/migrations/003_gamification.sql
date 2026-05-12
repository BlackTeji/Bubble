CREATE TABLE IF NOT EXISTS career_stages (
  id            SERIAL PRIMARY KEY,
  slug          VARCHAR(50) UNIQUE NOT NULL,
  title         VARCHAR(100) NOT NULL,
  description   TEXT,
  xp_threshold  INTEGER NOT NULL DEFAULT 0,
  order_index   INTEGER NOT NULL,
  lilibet_note  TEXT
);

INSERT INTO career_stages (slug, title, description, xp_threshold, order_index, lilibet_note) VALUES
  ('curious-beginner',      'Curious Beginner',      'Every analyst starts here — with a question.',    0,     1, 'You have just begun. The most important step is the one you just took.'),
  ('data-explorer',         'Data Explorer',         'You are learning to see patterns in the noise.',  150,   2, 'You are starting to see what others miss.'),
  ('junior-analyst',        'Junior Analyst',        'You can ask real questions of real data.',        400,   3, 'You are thinking like an analyst now.'),
  ('insight-hunter',        'Insight Hunter',        'You go beyond the numbers to find the story.',    900,   4, 'You are finding meaning, not just answers.'),
  ('dashboard-architect',   'Dashboard Architect',   'You turn complexity into clarity.',               1800,  5, 'You are building things that help others decide.'),
  ('analytics-strategist',  'Analytics Strategist',  'Data is your lens for understanding the world.',  3500,  6, 'You have become the person others come to.')
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS xp_transactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount     INTEGER NOT NULL,
  reason     VARCHAR(100) NOT NULL,
  lesson_id  UUID REFERENCES lessons(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(100) UNIQUE NOT NULL,
  title       VARCHAR(100) NOT NULL,
  description TEXT,
  icon        VARCHAR(100),
  trigger     VARCHAR(100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO badges (slug, title, description, icon, trigger) VALUES
  ('first-lesson',    'First Step',        'Completed your first lesson.',          'spark',     'lesson_count_1'),
  ('five-lessons',    'Getting Started',   'Completed 5 lessons.',                  'flame',     'lesson_count_5'),
  ('first-streak',    'Showing Up',        'Maintained a 3-day streak.',            'calendar',  'streak_3'),
  ('first-correct',   'On the Right Path', 'Got a quiz correct on the first try.',  'check',     'quiz_correct_first'),
  ('first-code',      'Code Curious',      'Ran your first query in the playground.','terminal', 'playground_first')
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_badges (
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id  UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS streaks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  current_streak  INTEGER NOT NULL DEFAULT 0,
  longest_streak  INTEGER NOT NULL DEFAULT 0,
  last_activity   DATE,
  grace_used      BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_id ON xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);