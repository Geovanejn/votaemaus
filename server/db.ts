import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import { createAllTables } from "@shared/db/create-tables";
import { hashPassword } from "./auth";

/* =======================
   ENV VALIDATION
======================= */
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

/* =======================
   POSTGRES CONNECTION
======================= */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

/* =======================
   DRIZZLE INSTANCE
======================= */
export const db = drizzle(pool, { schema });

/* =======================
   SEED: POSITIONS
======================= */
async function createDefaultPositions() {
  const positions = [
    { name: "Presidente" },
    { name: "Vice-Presidente" },
    { name: "1º Secretário" },
    { name: "2º Secretário" },
    { name: "Tesoureiro" },
  ];

  for (const pos of positions) {
    const [existing] = await db
      .select()
      .from(schema.positions)
      .where(eq(schema.positions.name, pos.name))
      .limit(1);

    if (!existing) {
      await db.insert(schema.positions).values(pos);
      console.log(`✔ Cargo criado: ${pos.name}`);
    }
  }
}

/* =======================
   SEED: ADMIN USER
======================= */
async function seedAdminUser() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log("ℹ ADMIN_EMAIL ou ADMIN_PASSWORD não definidos. Pulando seed.");
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();

  const [existingUser] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, normalizedEmail))
    .limit(1);

  if (existingUser) {
    if (!existingUser.isAdmin) {
      await db
        .update(schema.users)
        .set({ isAdmin: true })
        .where(eq(schema.users.id, existingUser.id));

      console.log(`✔ Usuário promovido a admin: ${normalizedEmail}`);
    }
    return;
  }

  const hashedPassword = await hashPassword(password);

  await db.insert(schema.users).values({
    fullName: "Administrador",
    email: normalizedEmail,
    password: hashedPassword,
    hasPassword: true,
    isAdmin: true,
    isMember: true,
    activeMember: true,
    secretaria: null,
  });

  console.log(`✔ Admin criado: ${normalizedEmail}`);
}

/* =======================
   DATABASE INITIALIZER
======================= */
export async function initializeDatabase() {
  console.log("🚀 Initializing database...");

  try {
    await pool.query("SELECT 1");
    console.log("✔ PostgreSQL conectado");

    // CRIA TABELAS (IDEMPOTENTE)
    await createAllTables(pool);

    // SEEDS
    await createDefaultPositions();
    await seedAdminUser();

    console.log("✅ Database ready");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}
