import { Router } from "express";
import { db, notificationsTable } from "../db/index.js";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

router.get("/notifications", requireAuth, async (req, res) => {
  const userId = req.dbUserId;
  try {
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
      createdAt: typeof n.createdAt === "string" ? n.createdAt : n.createdAt.toISOString(),
    })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.post("/notifications/read-all", requireAuth, async (req, res) => {
  const userId = req.dbUserId;
  try {
    await db.update(notificationsTable)
      .set({ read: true })
      .where(eq(notificationsTable.userId, userId));
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: "Failed to mark all as read" });
  }
});

router.post("/notifications/:id/read", requireAuth, async (req, res) => {
  const userId = req.dbUserId;
  const id = parseInt(req.params.id, 10);

  try {
    const [n] = await db.select().from(notificationsTable).where(eq(notificationsTable.id, id));
    if (!n || n.userId !== userId) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    await db.update(notificationsTable).set({ read: true }).where(eq(notificationsTable.id, id));
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

export default router;
