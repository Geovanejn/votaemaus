import { db } from "../server/db";
import * as schema from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { Pool } from "@neondatabase/serverless";

async function main() {
  console.log("=== Inicialização do Banco de Dados de Produção ===\n");

  console.log("1. Criando usuário administrador...");
  
  const adminEmail = "marketingumpemaus@gmail.com";
  const adminName = "UMP Emaús";
  const adminPassword = "umpEmaus2025#";
  
  try {
    const [existingAdmin] = await db.select()
      .from(schema.users)
      .where(eq(schema.users.email, adminEmail))
      .limit(1);
    
    if (existingAdmin) {
      console.log(`   - Administrador já existe: ${adminEmail}`);
      
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await db.update(schema.users)
        .set({ 
          password: hashedPassword, 
          hasPassword: true,
          isAdmin: true 
        })
        .where(eq(schema.users.email, adminEmail));
      console.log(`   ✓ Senha do administrador atualizada`);
    } else {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      await db.insert(schema.users).values({
        fullName: adminName,
        email: adminEmail,
        password: hashedPassword,
        isAdmin: true,
        isMember: true,
        hasPassword: true,
      });
      console.log(`   ✓ Administrador criado: ${adminName} (${adminEmail})`);
    }
  } catch (error) {
    console.error("   ✗ Erro ao criar administrador:", error);
    throw error;
  }

  console.log("\n2. Verificando cargos (positions)...");
  
  const defaultPositions = [
    { name: "Presidente", description: "Presidente da UMP" },
    { name: "Vice-Presidente", description: "Vice-Presidente da UMP" },
    { name: "1º Secretário", description: "Primeiro Secretário" },
    { name: "2º Secretário", description: "Segundo Secretário" },
    { name: "1º Tesoureiro", description: "Primeiro Tesoureiro" },
    { name: "2º Tesoureiro", description: "Segundo Tesoureiro" },
  ];

  for (const pos of defaultPositions) {
    try {
      const [existing] = await db.select()
        .from(schema.positions)
        .where(eq(schema.positions.name, pos.name))
        .limit(1);
      
      if (!existing) {
        await db.insert(schema.positions).values(pos);
        console.log(`   ✓ Cargo criado: ${pos.name}`);
      } else {
        console.log(`   - Cargo já existe: ${pos.name}`);
      }
    } catch (error) {
      console.log(`   - Erro ao criar cargo ${pos.name}:`, error);
    }
  }

  console.log("\n=== Inicialização concluída! ===");
  console.log(`\nCredenciais do administrador:`);
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Senha: ${adminPassword}`);
  console.log(`\nAgora você pode fazer login no sistema.`);
  
  process.exit(0);
}

main().catch((error) => {
  console.error("Erro fatal:", error);
  process.exit(1);
});
