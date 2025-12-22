import type { Config } from "drizzle-kit";

export default {
  schema: "./shared/schema/index.ts"
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
