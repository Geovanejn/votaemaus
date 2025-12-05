import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

async function createTablesIfNotExist() {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL DEFAULT '',
      phone TEXT,
      birth_date DATE,
      photo TEXT,
      bio TEXT,
      is_admin BOOLEAN NOT NULL DEFAULT false,
      is_member BOOLEAN NOT NULL DEFAULT true,
      has_password BOOLEAN NOT NULL DEFAULT false,
      notifications_enabled BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  const createPositionsTable = `
    CREATE TABLE IF NOT EXISTS positions (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT
    );
  `;

  const createElectionsTable = `
    CREATE TABLE IF NOT EXISTS elections (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      closed_at TIMESTAMP
    );
  `;

  const createCandidatesTable = `
    CREATE TABLE IF NOT EXISTS candidates (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      election_id INTEGER REFERENCES elections(id) NOT NULL,
      position_id INTEGER REFERENCES positions(id) NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      photo TEXT,
      bio TEXT
    );
  `;

  const createVotesTable = `
    CREATE TABLE IF NOT EXISTS votes (
      id SERIAL PRIMARY KEY,
      voter_id INTEGER REFERENCES users(id) NOT NULL,
      candidate_id INTEGER REFERENCES candidates(id) NOT NULL,
      position_id INTEGER REFERENCES positions(id) NOT NULL,
      election_id INTEGER REFERENCES elections(id) NOT NULL,
      scrutiny_round INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  const createElectionPositionsTable = `
    CREATE TABLE IF NOT EXISTS election_positions (
      id SERIAL PRIMARY KEY,
      election_id INTEGER REFERENCES elections(id) NOT NULL,
      position_id INTEGER REFERENCES positions(id) NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      current_scrutiny INTEGER NOT NULL DEFAULT 1,
      order_index INTEGER NOT NULL DEFAULT 0
    );
  `;

  const createElectionWinnersTable = `
    CREATE TABLE IF NOT EXISTS election_winners (
      id SERIAL PRIMARY KEY,
      election_id INTEGER REFERENCES elections(id) NOT NULL,
      position_id INTEGER REFERENCES positions(id) NOT NULL,
      candidate_id INTEGER REFERENCES candidates(id) NOT NULL,
      won_at_scrutiny INTEGER NOT NULL DEFAULT 1
    );
  `;

  const createDevotionalsTable = `
    CREATE TABLE IF NOT EXISTS devotionals (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      verse TEXT,
      verse_reference TEXT,
      author_id INTEGER REFERENCES users(id),
      published_at TIMESTAMP DEFAULT NOW(),
      is_ai_generated BOOLEAN NOT NULL DEFAULT false,
      theme TEXT
    );
  `;

  const createPrayerRequestsTable = `
    CREATE TABLE IF NOT EXISTS prayer_requests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) NOT NULL,
      content TEXT NOT NULL,
      is_anonymous BOOLEAN NOT NULL DEFAULT false,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  const createEventsTable = `
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      event_date TIMESTAMP NOT NULL,
      location TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  const createStudyModulesTable = `
    CREATE TABLE IF NOT EXISTS study_modules (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      order_index INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true
    );
  `;

  const createStudyLessonsTable = `
    CREATE TABLE IF NOT EXISTS study_lessons (
      id SERIAL PRIMARY KEY,
      module_id INTEGER REFERENCES study_modules(id) NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      order_index INTEGER NOT NULL DEFAULT 0,
      xp_reward INTEGER NOT NULL DEFAULT 10
    );
  `;

  const createUserProgressTable = `
    CREATE TABLE IF NOT EXISTS user_progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) NOT NULL,
      lesson_id INTEGER REFERENCES study_lessons(id) NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT false,
      completed_at TIMESTAMP,
      score INTEGER
    );
  `;

  const createNotificationsTable = `
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      is_read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  const createOtpCodesTable = `
    CREATE TABLE IF NOT EXISTS otp_codes (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  const tables = [
    createUsersTable,
    createPositionsTable,
    createElectionsTable,
    createCandidatesTable,
    createVotesTable,
    createElectionPositionsTable,
    createElectionWinnersTable,
    createDevotionalsTable,
    createPrayerRequestsTable,
    createEventsTable,
    createStudyModulesTable,
    createStudyLessonsTable,
    createUserProgressTable,
    createNotificationsTable,
    createOtpCodesTable,
  ];

  for (const sql of tables) {
    await pool.query(sql);
  }
}

async function createAdminIfNotExists() {
  const adminEmail = "marketingumpemaus@gmail.com";
  const adminName = "UMP Emaús";
  const adminPassword = "umpEmaus2025#";

  try {
    const result = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );

    if (result.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await pool.query(
        `INSERT INTO users (full_name, email, password, is_admin, is_member, has_password) 
         VALUES ($1, $2, $3, true, true, true)`,
        [adminName, adminEmail, hashedPassword]
      );
      console.log(`Admin user created: ${adminEmail}`);
    } else {
      console.log(`Admin user already exists: ${adminEmail}`);
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}

async function createDefaultPositions() {
  const positions = [
    { name: "Presidente", description: "Presidente da UMP" },
    { name: "Vice-Presidente", description: "Vice-Presidente da UMP" },
    { name: "1º Secretário", description: "Primeiro Secretário" },
    { name: "2º Secretário", description: "Segundo Secretário" },
    { name: "1º Tesoureiro", description: "Primeiro Tesoureiro" },
    { name: "2º Tesoureiro", description: "Segundo Tesoureiro" },
  ];

  for (const pos of positions) {
    try {
      const result = await pool.query(
        'SELECT id FROM positions WHERE name = $1',
        [pos.name]
      );

      if (result.rows.length === 0) {
        await pool.query(
          'INSERT INTO positions (name, description) VALUES ($1, $2)',
          [pos.name, pos.description]
        );
        console.log(`Position created: ${pos.name}`);
      }
    } catch (error) {
      // Position might already exist, ignore
    }
  }
}

export async function initializeDatabase() {
  console.log("Initializing PostgreSQL database connection...");
  
  try {
    const result = await pool.query('SELECT NOW()');
    console.log("PostgreSQL connection successful:", result.rows[0].now);
    
    console.log("Running database schema push via Drizzle...");
    
    // Create tables if they don't exist
    await createTablesIfNotExist();
    console.log("Database tables verified/created!");
    
    // Create admin user if not exists
    await createAdminIfNotExists();
    
    // Create default positions
    await createDefaultPositions();
    
    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}
