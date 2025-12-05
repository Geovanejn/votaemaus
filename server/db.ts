import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createAllTables } from "./create-tables";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

async function createAdminIfNotExists() {
  const adminEmail = "marketingumpemaus@gmail.com";
  const adminName = "UMP Emaús";
  const adminPassword = "umpEmaus2025#";

  try {
    const [existingAdmin] = await db.select()
      .from(schema.users)
      .where(eq(schema.users.email, adminEmail))
      .limit(1);

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await db.insert(schema.users).values({
        fullName: adminName,
        email: adminEmail,
        password: hashedPassword,
        isAdmin: true,
        isMember: true,
        hasPassword: true,
      });
      console.log(`Admin user created: ${adminEmail}`);
    } else {
      console.log(`Admin user already exists: ${adminEmail}`);
    }
  } catch (error: any) {
    console.error("Error creating admin user:", error);
  }
}

async function createDefaultPositions() {
  const positions = [
    { name: "Presidente" },
    { name: "Vice-Presidente" },
    { name: "1º Secretário" },
    { name: "2º Secretário" },
    { name: "1º Tesoureiro" },
    { name: "2º Tesoureiro" },
  ];

  for (const pos of positions) {
    try {
      const [existing] = await db.select()
        .from(schema.positions)
        .where(eq(schema.positions.name, pos.name))
        .limit(1);

      if (!existing) {
        await db.insert(schema.positions).values(pos);
        console.log(`Position created: ${pos.name}`);
      }
    } catch (error: any) {
      console.error(`Error creating position ${pos.name}:`, error);
    }
  }
}

export async function initializeDatabase() {
  console.log("Initializing PostgreSQL database connection...");
  
  try {
    const result = await pool.query('SELECT NOW()');
    console.log("PostgreSQL connection successful:", result.rows[0].now);
    
    // Create all tables first
    await createAllTables(pool);
    
    // Then create admin and positions
    await createAdminIfNotExists();
    await createDefaultPositions();
    
    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}
