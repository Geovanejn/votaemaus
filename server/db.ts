import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import { createAllTables } from "./create-tables";
import { hashPassword } from "./auth";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
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
    // Primeiro, verifica se já existe um usuário com esse email
    const [existingUser] = await db.select()
      .from(schema.users)
      .where(eq(schema.users.email, adminEmail.toLowerCase().trim()))
      .limit(1);
    
    const hashedPassword = await hashPassword(adminPassword);
    
    if (existingUser) {
      // Usuário existe, atualiza para admin e reseta a senha
      await db.update(schema.users)
        .set({ 
          isAdmin: true,
          password: hashedPassword,
          hasPassword: true
        })
        .where(eq(schema.users.id, existingUser.id));
      console.log(`Usuario ${adminEmail} configurado como admin.`);
      return;
    }
    
    // Não existe usuário com esse email, cria um novo
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
    
    await createAllTables(pool);
    await createDefaultPositions();
    await seedAdminUser();
    
    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}
