-- Induction Portal schema
-- Domains are constrained to these three values throughout the app.
-- (kept as TEXT + CHECK instead of ENUM for easier future edits)

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inductees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  roll_number VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  pref1 VARCHAR(30) NOT NULL CHECK (pref1 IN ('DevOps', 'Corporate Communications', 'Creatives')),
  pref2 VARCHAR(30) NOT NULL CHECK (pref2 IN ('DevOps', 'Corporate Communications', 'Creatives')),
  assigned_domain VARCHAR(30) CHECK (assigned_domain IN ('DevOps', 'Corporate Communications', 'Creatives')),
  round INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'advanced', 'rejected', 'selected')),
  results_visible BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT prefs_differ CHECK (pref1 <> pref2)
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  domain VARCHAR(30) NOT NULL CHECK (domain IN ('DevOps', 'Corporate Communications', 'Creatives')),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS qna (
  id SERIAL PRIMARY KEY,
  domain VARCHAR(30) NOT NULL CHECK (domain IN ('DevOps', 'Corporate Communications', 'Creatives')),
  inductee_id INTEGER NOT NULL REFERENCES inductees(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS interview_slots (
  id SERIAL PRIMARY KEY,
  domain VARCHAR(30) NOT NULL CHECK (domain IN ('DevOps', 'Corporate Communications', 'Creatives')),
  panelist VARCHAR(150),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS interview_bookings (
  id SERIAL PRIMARY KEY,
  slot_id INTEGER NOT NULL REFERENCES interview_slots(id) ON DELETE CASCADE,
  inductee_id INTEGER NOT NULL REFERENCES inductees(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'No-show')),
  notes TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (slot_id),
  UNIQUE (inductee_id)
);

CREATE INDEX IF NOT EXISTS idx_inductees_assigned_domain ON inductees(assigned_domain);
CREATE INDEX IF NOT EXISTS idx_tasks_domain ON tasks(domain);
CREATE INDEX IF NOT EXISTS idx_qna_domain ON qna(domain);
CREATE INDEX IF NOT EXISTS idx_slots_domain ON interview_slots(domain);
