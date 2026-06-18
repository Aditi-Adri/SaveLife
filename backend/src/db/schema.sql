-- SaveLife — Emergency SOS / ambulance database schema
-- Idempotent: safe to run repeatedly. Runs automatically on server boot,
-- or manually with: npm run db:migrate

CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  phone       VARCHAR(40),
  blood_type  VARCHAR(5),
  role        VARCHAR(20) NOT NULL DEFAULT 'user'
              CHECK (role IN ('user', 'responder')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- People to notify when a user triggers an SOS.
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          VARCHAR(120) NOT NULL,
  phone         VARCHAR(40) NOT NULL,
  relationship  VARCHAR(60),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON emergency_contacts(user_id);

-- An SOS alert raised by a user. Responders pick these up.
CREATE TABLE IF NOT EXISTS alerts (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  responder_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  type          VARCHAR(20) NOT NULL DEFAULT 'other'
                CHECK (type IN ('medical', 'accident', 'fire', 'crime', 'other')),
  status        VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'responded', 'resolved', 'cancelled')),
  latitude      DOUBLE PRECISION,
  longitude     DOUBLE PRECISION,
  message       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
