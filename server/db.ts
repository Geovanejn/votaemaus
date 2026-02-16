import { Pool } from "pg";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "./auth";

// Lazy initialization - pool and db are created on first access after validation
let pool: Pool | null = null;

async function runPendingMigrations(): Promise<void> {
  if (!pool) return;
  
  const migrations: { name: string; sql: string }[] = [
    {
      name: "add_color_to_shop_cart_items",
      sql: `ALTER TABLE shop_cart_items ADD COLUMN IF NOT EXISTS color TEXT;`
    },
    {
      name: "add_color_id_to_shop_cart_items",
      sql: `ALTER TABLE shop_cart_items ADD COLUMN IF NOT EXISTS color_id INTEGER;`
    },
    {
      name: "add_subtotal_amount_to_shop_orders",
      sql: `ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS subtotal_amount INTEGER;`
    },
    {
      name: "add_promo_discount_to_shop_orders",
      sql: `ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS promo_discount INTEGER DEFAULT 0;`
    },
    {
      name: "add_promo_code_to_shop_orders",
      sql: `ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS promo_code TEXT;`
    },
    {
      name: "add_combo_discount_to_shop_orders",
      sql: `ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS combo_discount INTEGER DEFAULT 0;`
    },
    {
      name: "add_combo_names_to_shop_orders",
      sql: `ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS combo_names TEXT;`
    },
    {
      name: "add_color_to_shop_order_items",
      sql: `ALTER TABLE shop_order_items ADD COLUMN IF NOT EXISTS color TEXT;`
    },
    {
      name: "add_color_id_to_shop_order_items",
      sql: `ALTER TABLE shop_order_items ADD COLUMN IF NOT EXISTS color_id INTEGER;`
    },
    {
      name: "add_is_kit_to_shop_items",
      sql: `ALTER TABLE shop_items ADD COLUMN IF NOT EXISTS is_kit BOOLEAN NOT NULL DEFAULT false;`
    },
    {
      name: "create_shop_kit_components",
      sql: `CREATE TABLE IF NOT EXISTS shop_kit_components (
        id SERIAL PRIMARY KEY,
        kit_item_id INTEGER NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
        component_item_id INTEGER NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL DEFAULT 0
      );`
    },
    {
      name: "create_shop_cart_item_kit_selections",
      sql: `CREATE TABLE IF NOT EXISTS shop_cart_item_kit_selections (
        id SERIAL PRIMARY KEY,
        cart_item_id INTEGER NOT NULL REFERENCES shop_cart_items(id) ON DELETE CASCADE,
        component_id INTEGER NOT NULL REFERENCES shop_kit_components(id) ON DELETE CASCADE,
        component_item_id INTEGER NOT NULL,
        component_name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        size TEXT,
        color TEXT,
        color_id INTEGER
      );`
    },
    {
      name: "create_shop_order_item_kit_selections",
      sql: `CREATE TABLE IF NOT EXISTS shop_order_item_kit_selections (
        id SERIAL PRIMARY KEY,
        order_item_id INTEGER NOT NULL REFERENCES shop_order_items(id) ON DELETE CASCADE,
        component_id INTEGER NOT NULL REFERENCES shop_kit_components(id) ON DELETE CASCADE,
        component_item_id INTEGER NOT NULL,
        component_name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        size TEXT,
        color TEXT,
        color_id INTEGER
      );`
    },
    {
      name: "add_original_image_url_to_devotionals",
      sql: `ALTER TABLE devotionals ADD COLUMN IF NOT EXISTS original_image_url TEXT;`
    },
    {
      name: "fix_kit_selection_quantities_to_1",
      sql: `UPDATE shop_order_item_kit_selections SET quantity = 1 WHERE quantity > 1;`
    },
    {
      name: "add_share_token_to_shop_orders",
      sql: `ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;`
    },
    {
      name: "create_order_push_subscriptions",
      sql: `CREATE TABLE IF NOT EXISTS order_push_subscriptions (
        id SERIAL PRIMARY KEY,
        share_token TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(share_token, endpoint)
      );`
    },
    {
      name: "create_order_push_subs_share_token_idx",
      sql: `CREATE INDEX IF NOT EXISTS order_push_subs_share_token_idx ON order_push_subscriptions (share_token);`
    },
  ];

  for (const migration of migrations) {
    try {
      await pool.query(migration.sql);
    } catch (error: any) {
      if (error.code !== '42701') {
        console.error(`[Migration] Failed: ${migration.name}`, error.message);
      }
    }
  }
  console.log("[Migration] Schema migrations checked successfully");

  try {
    await pool.query(`
      UPDATE shop_items SET is_kit = true 
      WHERE is_kit = false 
      AND category_id IN (
        SELECT id FROM shop_categories WHERE LOWER(name) LIKE '%kit%'
      )
    `);
  } catch (error: any) {
    // ignore if columns don't exist yet
  }
}
let _db: NodePgDatabase<typeof schema> | null = null;

// Getter for db - throws if not initialized
export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_, prop) {
    if (!_db) {
      throw new Error("Database not initialized. Call initializeDatabase() first.");
    }
    return (_db as any)[prop];
  }
});

function validateAndCreatePool(): Pool {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error("================================================================================");
    console.error("[FATAL] DATABASE_URL environment variable is not set!");
    console.error("[FATAL] Please configure DATABASE_URL in your environment variables.");
    console.error("[FATAL] For Render: Go to Dashboard > Environment > Add DATABASE_URL");
    console.error("[FATAL] Format: postgresql://user:password@host:port/database");
    console.error("================================================================================");
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
  }

  if (!dbUrl.startsWith("postgres://") && !dbUrl.startsWith("postgresql://")) {
    console.error("================================================================================");
    console.error("[FATAL] DATABASE_URL has invalid format!");
    console.error("[FATAL] Current value starts with:", dbUrl.substring(0, Math.min(20, dbUrl.length)));
    console.error("[FATAL] Expected format: postgresql://user:password@host:port/database");
    console.error("================================================================================");
    throw new Error("DATABASE_URL has invalid format - must start with postgres:// or postgresql://");
  }

  return new Pool({ 
    connectionString: dbUrl,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });
}

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

export async function initializeDatabase(): Promise<void> {
  console.log("Initializing PostgreSQL database connection...");
  
  // Validate and create pool on first call
  if (!pool) {
    pool = validateAndCreatePool();
    _db = drizzle(pool, { schema });
  }
  
  try {
    const result = await pool.query('SELECT NOW()');
    console.log("PostgreSQL connection successful:", result.rows[0].now);
    
    // Tables are created via Drizzle migration (migrations/0000_seasons_schema.sql)
    // No need to create tables here - Drizzle handles schema sync
    
    await runPendingMigrations();
    await createDefaultPositions();
    await seedAdminUser();
    
    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("[DB] Database initialization error:", error);
    throw error;
  }
}
