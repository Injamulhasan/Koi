import { Router } from "express";
import { db, locationsTable, votesTable } from "../db/index.js";
import { sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

router.get("/locations", requireAuth, async (_req, res) => {
  try {
    const locations = await db.select().from(locationsTable).orderBy(locationsTable.id);

    const voteCounts = await db
      .select({
        locationId: votesTable.locationId,
        count: sql`count(*)::int`,
      })
      .from(votesTable)
      .groupBy(votesTable.locationId);

    const countMap = new Map(voteCounts.map(v => [v.locationId, v.count]));

    res.json(locations.map(loc => ({
      id: loc.id,
      name: loc.name,
      voteCount: countMap.get(loc.id) ?? 0,
    })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});

export default router;
