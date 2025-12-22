import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "./auth";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Debug: Log DATABASE_URL to diagnose connection issues
console.log("[DB] NODE_ENV:", process.env.NODE_ENV);
console.log("[DB] DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("[DB] DATABASE_URL length:", process.env.DATABASE_URL?.length);
console.log("[DB] DATABASE_URL (first 50 chars):", process.env.DATABASE_URL?.substring(0, 50));
console.log("[DB] DATABASE_URL (last 30 chars):", process.env.DATABASE_URL?.substring(Math.max(0, process.env.DATABASE_URL.length - 30)));

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});
export const db = drizzle(pool, { schema });

async function createDefaultPositions() {
  const positions = [
    { name: "Presidente" },
    { name: "Vice-Presidente" },
    { name: "1º Secretário" },
    { name: "2º Secretário" },
    { name: "Tesoureiro" },
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

async function seedAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminEmail || !adminPassword) {
    console.log("ADMIN_EMAIL ou ADMIN_PASSWORD nao definidos. Pulando configuracao do admin.");
    return;
  }
  
  try {
    const [existingUser] = await db.select()
      .from(schema.users)
      .where(eq(schema.users.email, adminEmail.toLowerCase().trim()))
      .limit(1);
    
    if (existingUser) {
      if (existingUser.isAdmin) {
        console.log(`Admin ${adminEmail} ja existe e esta configurado.`);
        return;
      }
      await db.update(schema.users)
        .set({ isAdmin: true })
        .where(eq(schema.users.id, existingUser.id));
      console.log(`Usuario ${adminEmail} promovido a admin (senha mantida).`);
      return;
    }
    
    const hashedPassword = await hashPassword(adminPassword);
    await db.insert(schema.users).values({
      fullName: "Administrador",
      email: adminEmail.toLowerCase().trim(),
      password: hashedPassword,
      hasPassword: true,
      isAdmin: true,
      isMember: true,
      activeMember: true,
      secretaria: null,
    });
    
    console.log(`Admin criado com sucesso: ${adminEmail}`);
  } catch (error: any) {
    console.error("Erro ao configurar admin:", error.message);
  }
}

export async function initializeDatabase() {
  console.log("Initializing PostgreSQL database connection...");
  
  try {
    const result = await pool.query('SELECT NOW()');
    console.log("PostgreSQL connection successful:", result.rows[0].now);
    
    // Tables are created via Drizzle migration (migrations/0000_seasons_schema.sql)
    // No need to create tables here - Drizzle handles schema sync
    
    await createDefaultPositions();
    await seedAdminUser();
    
    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}
