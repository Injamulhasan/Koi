import { Router } from "express";
import { db, votesTable, usersTable, locationsTable, notificationsTable } from "../db/index.js";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth.js";
import { broadcast } from "../lib/wsServer.js";

const router = Router();

async function broadcastNotification(dbClient, excludeUserId, type, message) {
  try {
    const users = await dbClient.select({ id: usersTable.id }).from(usersTable).where(
      sql`${usersTable.id} != ${excludeUserId}`
    );
    if (users.length > 0) {
      await dbClient.insert(notificationsTable).values(
        users.map((u) => ({ userId: u.id, type, message }))
      );
    }
  } catch (err) {
    console.error("Failed to broadcast notification:", err);
  }
}

router.get("/votes", requireAuth, async (_req, res) => {
  try {
    const votes = await db
      .select({
        id: votesTable.id,
        userId: votesTable.userId,
        locationId: votesTable.locationId,
        locationName: locationsTable.name,
        userName: usersTable.name,
        userAvatarUrl: usersTable.avatarUrl,
        createdAt: votesTable.createdAt,
      })
      .from(votesTable)
      .innerJoin(usersTable, eq(votesTable.userId, usersTable.id))
      .innerJoin(locationsTable, eq(votesTable.locationId, locationsTable.id))
      .orderBy(votesTable.createdAt);

    res.json(votes.map(v => ({
      id: v.id,
      userId: v.userId,
      locationId: v.locationId,
      locationName: v.locationName,
      userName: v.userName,
      userAvatarUrl: v.userAvatarUrl ?? null,
      createdAt: typeof v.createdAt === "string" ? v.createdAt : v.createdAt.toISOString(),
    })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch votes" });
  }
});

router.get("/votes/my", requireAuth, async (req, res) => {
  const userId = req.dbUserId;
  try {
    const [vote] = await db
      .select({
        id: votesTable.id,
        userId: votesTable.userId,
        locationId: votesTable.locationId,
        locationName: locationsTable.name,
        userName: usersTable.name,
        userAvatarUrl: usersTable.avatarUrl,
        createdAt: votesTable.createdAt,
      })
      .from(votesTable)
      .innerJoin(usersTable, eq(votesTable.userId, usersTable.id))
      .innerJoin(locationsTable, eq(votesTable.locationId, locationsTable.id))
      .where(eq(votesTable.userId, userId));

    if (!vote) {
      res.json(null);
      return;
    }

    res.json({
      id: vote.id,
      userId: vote.userId,
      locationId: vote.locationId,
      locationName: vote.locationName,
      userName: vote.userName,
      userAvatarUrl: vote.userAvatarUrl ?? null,
      createdAt: typeof vote.createdAt === "string" ? vote.createdAt : vote.createdAt.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch my vote" });
  }
});

router.post("/votes", requireAuth, async (req, res) => {
  const userId = req.dbUserId;
  const { locationId } = req.body;

  if (!locationId) {
    res.status(400).json({ error: "locationId is required" });
    return;
  }

  try {
    const [location] = await db.select().from(locationsTable).where(eq(locationsTable.id, locationId));
    if (!location) {
      res.status(404).json({ error: "Location not found" });
      return;
    }

    const [existing] = await db.select().from(votesTable).where(eq(votesTable.userId, userId));

    let vote;
    if (existing) {
      const [updated] = await db.update(votesTable)
        .set({ locationId, createdAt: new Date() })
        .where(eq(votesTable.userId, userId))
        .returning();
      vote = updated;
    } else {
      const [created] = await db.insert(votesTable).values({ userId, locationId }).returning();
      vote = created;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    await broadcastNotification(db, userId, "vote", `${user.name} voted for ${location.name}`);

    const payload = {
      id: vote.id,
      userId: vote.userId,
      locationId: vote.locationId,
      locationName: location.name,
      userName: user.name,
      userAvatarUrl: user.avatarUrl ?? null,
      createdAt: typeof vote.createdAt === "string" ? vote.createdAt : vote.createdAt.toISOString(),
    };
    broadcast("vote:cast", payload);
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: "Failed to cast vote" });
  }
});

router.delete("/votes/my", requireAuth, async (req, res) => {
  const userId = req.dbUserId;
  try {
    await db.delete(votesTable).where(eq(votesTable.userId, userId));
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: "Failed to clear vote" });
  }
});

export default router;
