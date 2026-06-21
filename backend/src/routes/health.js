import { Router } from "express";
import { db } from "../db/index.js";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/health", async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    res.status(500).json({ 
      status: "error", 
      database: "disconnected", 
      error: err.message,
      stack: err.stack,
      envDatabaseUrlSet: !!process.env.DATABASE_URL
    });
  }
});

export default router;
