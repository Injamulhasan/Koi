import { Router } from "express";
import { db, votesTable, usersTable, locationsTable, notificationsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireDbUser } from "../middlewares/requireAuth";

const router = Router();

async function broadcastNotification(db: any, excludeUserId: number, type: string, message: string) {
  const users = await db.select({ id: usersTable.id }).from(usersTable).where(
    sql`${usersTable.id} != ${excludeUserId}`
  );
  if (users.length > 0) {
    await db.insert(notificationsTable).values(
      users.map((u: { id: number }) => ({ userId: u.id, type, message }))
    );
  }
}

router.get("/votes", requireDbUser, async (_req, res): Promise<void> => {
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
    createdAt: v.createdAt.toISOString(),
  })));
});

router.get("/votes/my", requireDbUser, async (req, res): Promise<void> => {
  const userId = req.dbUserId!;
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
    createdAt: vote.createdAt.toISOString(),
  });
});

router.post("/votes", requireDbUser, async (req, res): Promise<void> => {
  const userId = req.dbUserId!;
  const { locationId } = req.body;

  if (!locationId) {
    res.status(400).json({ error: "locationId is required" });
    return;
  }

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

  res.json({
    id: vote.id,
    userId: vote.userId,
    locationId: vote.locationId,
    locationName: location.name,
    userName: user.name,
    userAvatarUrl: user.avatarUrl ?? null,
    createdAt: vote.createdAt.toISOString(),
  });
});

router.delete("/votes/my", requireDbUser, async (req, res): Promise<void> => {
  const userId = req.dbUserId!;
  await db.delete(votesTable).where(eq(votesTable.userId, userId));
  res.sendStatus(204);
});

export default router;
