import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl && process.env.NODE_ENV === "production") {
  console.warn("WARNING: DATABASE_URL is not set. Database operations will fail at runtime.");
}

export const pool = new Pool({ connectionString: dbUrl || "" });
export const db = drizzle(pool, { schema });

export * from "./schema";
