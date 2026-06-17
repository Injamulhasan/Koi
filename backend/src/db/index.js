import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const { Pool } = pg;

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.warn("WARNING: DATABASE_URL is not set. Database operations will fail at runtime.");
}

export const pool = new Pool({
  connectionString: dbUrl || "",
  ssl: dbUrl && (dbUrl.includes("supabase") || dbUrl.includes("pooler")) ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });

export * from "./schema.js";
