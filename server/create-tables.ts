import { Pool } from "pg";

export async function createAllTables(pool: Pool) {
  console.log("🔧 Ensuring full database schema...");

  const sql = `
  /* =====================
     CORE
  ====================== */

  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT,
    has_password BOOLEAN NOT NULL DEFAULT false,
    photo_url TEXT,
    birthdate TEXT,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    is_member BOOLEAN NOT NULL DEFAULT true,
    active_member BOOLEAN NOT NULL DEFAULT true,
    secretaria TEXT
  );

  CREATE TABLE IF NOT EXISTS positions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
  );

  /* =====================
     ELECTIONS
  ====================== */

  CREATE TABLE IF NOT EXISTS elections (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    closed_at TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS candidates (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id),
    position_id INTEGER REFERENCES positions(id),
    election_id INTEGER REFERENCES elections(id),
    UNIQUE (user_id, position_id, election_id)
  );

  CREATE TABLE IF NOT EXISTS election_winners (
    id SERIAL PRIMARY KEY,
    election_id INTEGER REFERENCES elections(id),
    position_id INTEGER REFERENCES positions(id),
    candidate_id INTEGER REFERENCES candidates(id),
    won_at_scrutiny INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS election_positions (
    id SERIAL PRIMARY KEY,
    election_id INTEGER REFERENCES elections(id),
    position_id INTEGER REFERENCES positions(id),
    order_index INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    current_scrutiny INTEGER DEFAULT 1,
    opened_at TIMESTAMP,
    closed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS election_attendance (
    id SERIAL PRIMARY KEY,
    election_id INTEGER REFERENCES elections(id),
    election_position_id INTEGER REFERENCES election_positions(id),
    member_id INTEGER REFERENCES users(id),
    is_present BOOLEAN DEFAULT false,
    marked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    voter_id INTEGER REFERENCES users(id),
    candidate_id INTEGER REFERENCES candidates(id),
    position_id INTEGER REFERENCES positions(id),
    election_id INTEGER REFERENCES elections(id),
    scrutiny_round INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
  );

  /* =====================
     CONTENT
  ====================== */

  CREATE TABLE IF NOT EXISTS devotionals (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    verse TEXT NOT NULL,
    verse_reference TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    prayer TEXT,
    image_url TEXT,
    author TEXT,
    published_at TIMESTAMP DEFAULT NOW(),
    is_published BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS site_events (
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
    category TEXT DEFAULT 'geral',
    is_published BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_all_day BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS instagram_posts (
    id SERIAL PRIMARY KEY,
    caption TEXT,
    image_url TEXT NOT NULL,
    permalink TEXT,
    posted_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS prayer_requests (
    id SERIAL PRIMARY KEY,
    name TEXT,
    whatsapp TEXT,
    category TEXT DEFAULT 'outros',
    request TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    prayed_by INTEGER REFERENCES users(id),
    prayed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS banners (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT,
    background_color TEXT,
    link_url TEXT,
    link_text TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMP,
    ends_at TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS board_members (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    photo_url TEXT,
    instagram TEXT,
    whatsapp TEXT,
    bio TEXT,
    term_start TEXT NOT NULL,
    term_end TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    is_current BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS site_content (
    id SERIAL PRIMARY KEY,
    page TEXT NOT NULL,
    section TEXT NOT NULL,
    title TEXT,
    content TEXT,
    image_url TEXT,
    metadata TEXT,
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (page, section)
  );

  /* =====================
     SEASONS & STUDY
  ====================== */

  CREATE TABLE IF NOT EXISTS seasons (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    cover_image_url TEXT,
    pdf_url TEXT,
    ai_extracted_title TEXT,
    status TEXT DEFAULT 'draft',
    total_lessons INTEGER DEFAULT 0,
    published_at TIMESTAMP,
    starts_at TIMESTAMP,
    ends_at TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    ai_metadata TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS season_final_challenges (
    id SERIAL PRIMARY KEY,
    season_id INTEGER REFERENCES seasons(id),
    title TEXT DEFAULT 'Desafio Final',
    description TEXT,
    questions TEXT NOT NULL,
    question_count INTEGER DEFAULT 15,
    time_limit_seconds INTEGER DEFAULT 150,
    xp_reward INTEGER DEFAULT 100,
    perfect_xp_bonus INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS user_season_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    season_id INTEGER REFERENCES seasons(id),
    lessons_completed INTEGER DEFAULT 0,
    total_lessons INTEGER DEFAULT 0,
    bonus_lessons_completed INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    total_answers INTEGER DEFAULT 1,
    hearts_lost INTEGER DEFAULT 0,
    final_challenge_completed BOOLEAN DEFAULT false,
    final_challenge_perfect BOOLEAN DEFAULT false,
    is_mastered BOOLEAN DEFAULT false,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    last_activity_at TIMESTAMP,
    UNIQUE (user_id, season_id)
  );

  CREATE TABLE IF NOT EXISTS season_rankings (
    id SERIAL PRIMARY KEY,
    season_id INTEGER REFERENCES seasons(id),
    user_id INTEGER REFERENCES users(id),
    xp_earned INTEGER DEFAULT 0,
    lessons_completed INTEGER DEFAULT 0,
    correct_percentage INTEGER DEFAULT 0,
    final_challenge_score INTEGER,
    is_mastered BOOLEAN DEFAULT false,
    rank_position INTEGER,
    is_winner BOOLEAN DEFAULT false,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (season_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS study_weeks (
    id SERIAL PRIMARY KEY,
    week_number INTEGER NOT NULL,
    year INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    pdf_url TEXT,
    status TEXT DEFAULT 'draft',
    published_at TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    ai_metadata TEXT,
    season_id INTEGER REFERENCES seasons(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (week_number, year)
  );

  CREATE TABLE IF NOT EXISTS study_lessons (
    id SERIAL PRIMARY KEY,
    study_week_id INTEGER REFERENCES study_weeks(id),
    season_id INTEGER REFERENCES seasons(id),
    order_index INTEGER NOT NULL,
    lesson_number INTEGER,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'study',
    description TEXT,
    xp_reward INTEGER DEFAULT 10,
    estimated_minutes INTEGER DEFAULT 5,
    icon TEXT,
    is_bonus BOOLEAN DEFAULT false,
    has_bonus_quiz BOOLEAN DEFAULT false,
    bonus_quiz_questions TEXT,
    is_locked BOOLEAN DEFAULT true,
    is_released BOOLEAN DEFAULT false,
    release_date TIMESTAMP,
    unlock_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS study_units (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER REFERENCES study_lessons(id),
    order_index INTEGER NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    xp_value INTEGER DEFAULT 2,
    stage TEXT DEFAULT 'estude',
    created_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS user_unit_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    unit_id INTEGER REFERENCES study_units(id),
    is_completed BOOLEAN DEFAULT false,
    answer_given TEXT,
    is_correct BOOLEAN,
    attempts INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    UNIQUE (user_id, unit_id)
  );

  /* =====================
     AUDIT
  ====================== */

  CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id INTEGER,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );
  `;

  try {
    await pool.query(sql);
    console.log("✅ Full database schema ensured");
  } catch (err) {
    console.error("❌ Schema creation failed:", err);
    throw err;
  }
}
