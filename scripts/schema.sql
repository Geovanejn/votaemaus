-- ====================
-- USERS
-- ====================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  has_password BOOLEAN NOT NULL DEFAULT false,
  photo_url TEXT,
  birthdate TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  is_member BOOLEAN NOT NULL DEFAULT true,
  active_member BOOLEAN NOT NULL DEFAULT true,
  secretaria TEXT
);

-- ====================
-- POSITIONS
-- ====================
CREATE TABLE positions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- ====================
-- ELECTIONS
-- ====================
CREATE TABLE elections (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  closed_at TIMESTAMP
);

-- ====================
-- CANDIDATES
-- ====================
CREATE TABLE candidates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  position_id INTEGER NOT NULL REFERENCES positions(id),
  election_id INTEGER NOT NULL REFERENCES elections(id),
  UNIQUE (user_id, position_id, election_id)
);

-- ====================
-- ELECTION WINNERS
-- ====================
CREATE TABLE election_winners (
  id SERIAL PRIMARY KEY,
  election_id INTEGER NOT NULL REFERENCES elections(id),
  position_id INTEGER NOT NULL REFERENCES positions(id),
  candidate_id INTEGER NOT NULL REFERENCES candidates(id),
  won_at_scrutiny INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- ====================
-- ELECTION POSITIONS
-- ====================
CREATE TABLE election_positions (
  id SERIAL PRIMARY KEY,
  election_id INTEGER NOT NULL REFERENCES elections(id),
  position_id INTEGER NOT NULL REFERENCES positions(id),
  order_index INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  current_scrutiny INTEGER NOT NULL DEFAULT 1,
  opened_at TIMESTAMP,
  closed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- ====================
-- ELECTION ATTENDANCE
-- ====================
CREATE TABLE election_attendance (
  id SERIAL PRIMARY KEY,
  election_id INTEGER NOT NULL REFERENCES elections(id),
  election_position_id INTEGER REFERENCES election_positions(id),
  member_id INTEGER NOT NULL REFERENCES users(id),
  is_present BOOLEAN NOT NULL DEFAULT false,
  marked_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- ====================
-- VOTES
-- ====================
CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  voter_id INTEGER NOT NULL REFERENCES users(id),
  candidate_id INTEGER NOT NULL REFERENCES candidates(id),
  position_id INTEGER NOT NULL REFERENCES positions(id),
  election_id INTEGER NOT NULL REFERENCES elections(id),
  scrutiny_round INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- ====================
-- VERIFICATION CODES
-- ====================
CREATE TABLE verification_codes (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_password_reset BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- ====================
-- PDF VERIFICATIONS
-- ====================
CREATE TABLE pdf_verifications (
  id SERIAL PRIMARY KEY,
  election_id INTEGER NOT NULL REFERENCES elections(id),
  verification_hash TEXT NOT NULL UNIQUE,
  president_name TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- ====================
-- DEVOTIONALS
-- ====================
CREATE TABLE devotionals (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  verse TEXT NOT NULL,
  verse_reference TEXT NOT NULL,
  content TEXT NOT NULL,
  content_html TEXT,
  summary TEXT,
  prayer TEXT,
  image_url TEXT,
  author TEXT,
  published_at TIMESTAMP NOT NULL DEFAULT now(),
  scheduled_at TIMESTAMP,
  is_published BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- ====================
-- SITE EVENTS
-- ====================
CREATE TABLE site_events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  image_url TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT,
  time TEXT,
  location TEXT,
  location_url TEXT,
  price TEXT,
  registration_url TEXT,
  category TEXT NOT NULL DEFAULT 'geral',
  is_published BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_all_day BOOLEAN NOT NULL DEFAULT false,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- ====================
-- INSTAGRAM POSTS
-- ====================
CREATE TABLE instagram_posts (
  id SERIAL PRIMARY KEY,
  instagram_id TEXT,
  caption TEXT,
  image_url TEXT NOT NULL,
  video_url TEXT,
  media_type TEXT DEFAULT 'IMAGE',
  permalink TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  posted_at TIMESTAMP NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured_banner BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- ====================
-- ACHIEVEMENTS
-- ====================
CREATE TABLE achievements (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  custom_icon_url TEXT,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  requirement TEXT,
  is_secret BOOLEAN NOT NULL DEFAULT false
);

-- ====================
-- XP TRANSACTIONS
-- ====================
CREATE TABLE xp_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  source_id INTEGER,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
