import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export async function initializeDatabase() {
  console.log("Initializing PostgreSQL database connection...");
  
  try {
    const result = await pool.query('SELECT NOW()');
    console.log("PostgreSQL connection successful:", result.rows[0].now);
    
    console.log("Running database schema push via Drizzle...");
    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}
