import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "./auth";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
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
    const [existing] = await db
      .select()
      .from(schema.positions)
      .where(eq(schema.positions.name, pos.name))
      .limit(1);

    if (!existing) {
      await db.insert(schema.positions).values(pos);
      console.log(`Position created: ${pos.name}`);
    }
  }
}

async function seedAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log("ADMIN_EMAIL ou ADMIN_PASSWORD não definidos. Pulando admin seed.");
    return;
  }

  const normalizedEmail = adminEmail.toLowerCase().trim();

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

      console.log(`Usuário ${normalizedEmail} promovido a admin.`);
    }
    return;
  }

  const hashedPassword = await hashPassword(adminPassword);

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

  console.log(`Admin criado com sucesso: ${normalizedEmail}`);
}

export async function initializeDatabase() {
  console.log("Initializing database...");

  try {
    const result = await pool.query("SELECT 1");
    console.log("PostgreSQL conectado.");

    await createDefaultPositions();
    await seedAdminUser();

    console.log("Database initialization completed.");
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}
