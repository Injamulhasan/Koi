import { Router } from "express";
import { db, locationsTable, votesTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/locations", requireAuth, async (_req, res): Promise<void> => {
  const locations = await db.select().from(locationsTable).orderBy(locationsTable.id);

  const voteCounts = await db
    .select({
      locationId: votesTable.locationId,
      count: sql<number>`count(*)::int`,
    })
    .from(votesTable)
    .groupBy(votesTable.locationId);

  const countMap = new Map(voteCounts.map(v => [v.locationId, v.count]));

  res.json(locations.map(loc => ({
    id: loc.id,
    name: loc.name,
    voteCount: countMap.get(loc.id) ?? 0,
  })));
});

export default router;
