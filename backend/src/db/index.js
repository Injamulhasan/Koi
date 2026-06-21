import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const { Pool } = pg;

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.warn("WARNING: DATABASE_URL is not set. Database operations will fail at runtime.");
}

let poolConfig = {};

if (dbUrl) {
  try {
    const parsed = new URL(dbUrl);
    poolConfig = {
      user: parsed.username,
      password: decodeURIComponent(parsed.password),
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : 5432,
      database: parsed.pathname.substring(1) || "postgres",
      ssl: { rejectUnauthorized: false },
    };
  } catch (err) {
    console.error("Failed to parse DATABASE_URL using URL parser, falling back to connectionString config:", err);
    poolConfig = {
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
    };
  }
} else {
  poolConfig = {
    ssl: { rejectUnauthorized: false },
  };
}

export const pool = new Pool(poolConfig);

export const db = drizzle(pool, { schema });

export * from "./schema.js";
