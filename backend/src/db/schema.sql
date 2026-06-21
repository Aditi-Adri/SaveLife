-- SaveLife — blood / organ / plasma donation database schema
-- Idempotent: safe to run repeatedly. Runs automatically on server boot,
-- or manually with: npm run db:migrate

CREATE TABLE IF NOT EXISTS users (
  id                 SERIAL PRIMARY KEY,
  user_code          VARCHAR(20) UNIQUE,        -- auto-generated login ID, e.g. SLF-7K9QF2
  name               VARCHAR(120) NOT NULL,
  email              VARCHAR(255) UNIQUE NOT NULL,
  password           VARCHAR(255) NOT NULL,
  phone              VARCHAR(20),               -- 11-digit number
  age                INTEGER,
  gender             VARCHAR(20),
  weight             NUMERIC(5,2),              -- kg
  blood_type         VARCHAR(5),
  donation_count     INTEGER DEFAULT 0,
  last_donation      DATE,
  donation_history   TEXT,
  drug_addicted      BOOLEAN DEFAULT false,
  medical_conditions TEXT,                      -- any sickness / conditions
  role               VARCHAR(20) NOT NULL DEFAULT 'user'
                     CHECK (role IN ('user', 'responder')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Patch older installs that created `users` before these columns existed.
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_code          VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS age                INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender             VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS weight             NUMERIC(5,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS donation_count     INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_donation      DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS donation_history   TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS drug_addicted      BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS medical_conditions TEXT;

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

-- Blood requests posted by users; browsable read-only on the public Explore page.
CREATE TABLE IF NOT EXISTS blood_requests (
  id            SERIAL PRIMARY KEY,
  requester_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  patient_name  VARCHAR(120) NOT NULL,
  blood_type    VARCHAR(5) NOT NULL,
  units_needed  INTEGER NOT NULL DEFAULT 1,
  hospital      VARCHAR(160),
  location      VARCHAR(160),
  latitude      DOUBLE PRECISION,
  longitude     DOUBLE PRECISION,
  contact_phone VARCHAR(20),
  urgency       VARCHAR(20) NOT NULL DEFAULT 'urgent'
                CHECK (urgency IN ('normal', 'urgent', 'critical')),
  status        VARCHAR(20) NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'fulfilled', 'cancelled')),
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_requests_status ON blood_requests(status);

-- Patch older installs that created blood_requests before geo columns existed.
ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS latitude  DOUBLE PRECISION;
ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Hospitals users can browse and book.
CREATE TABLE IF NOT EXISTS hospitals (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(160) NOT NULL,
  city            VARCHAR(80),
  address         VARCHAR(200),
  phone           VARCHAR(30),
  email           VARCHAR(160),
  beds_available  INTEGER DEFAULT 0,
  has_blood_bank  BOOLEAN DEFAULT false,
  has_ambulance   BOOLEAN DEFAULT false,
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS email VARCHAR(160);

CREATE TABLE IF NOT EXISTS hospital_bookings (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hospital_id   INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  patient_name  VARCHAR(120) NOT NULL,
  reason        VARCHAR(200),
  booking_date  DATE,
  status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_user ON hospital_bookings(user_id);

-- Ambulance services for the emergency "call ambulance" page.
CREATE TABLE IF NOT EXISTS ambulance_services (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(160) NOT NULL,
  city           VARCHAR(80),
  phone          VARCHAR(30) NOT NULL,
  email          VARCHAR(160),
  available_24_7 BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ambulance_services ADD COLUMN IF NOT EXISTS email VARCHAR(160);
