import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireDbUser } from "../middlewares/requireAuth";

const router = Router();

router.get("/notifications", requireDbUser, async (req, res): Promise<void> => {
  const userId = req.dbUserId!;
  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);

  res.json(notifications.map(n => ({
    id: n.id,
    userId: n.userId,
    type: n.type,
    message: n.message,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  })));
});

router.post("/notifications/read-all", requireDbUser, async (req, res): Promise<void> => {
  const userId = req.dbUserId!;
  await db.update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.userId, userId));
  res.sendStatus(204);
});

router.post("/notifications/:id/read", requireDbUser, async (req, res): Promise<void> => {
  const userId = req.dbUserId!;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [n] = await db.select().from(notificationsTable).where(eq(notificationsTable.id, id));
  if (!n || n.userId !== userId) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await db.update(notificationsTable).set({ read: true }).where(eq(notificationsTable.id, id));
  res.sendStatus(204);
});

export default router;
