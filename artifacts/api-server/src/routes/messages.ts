import { Router } from "express";
import { db, messagesTable, messageReactionsTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, desc, lt, sql, and } from "drizzle-orm";
import { requireDbUser } from "../middlewares/requireAuth";

const router = Router();

async function getMessagesWithReactions(limit: number, before?: number) {
  const conditions = before ? lt(messagesTable.id, before) : undefined;

  const msgs = await db
    .select({
      id: messagesTable.id,
      userId: messagesTable.userId,
      userName: usersTable.name,
      userAvatarUrl: usersTable.avatarUrl,
      messageText: messagesTable.messageText,
      imageUrl: messagesTable.imageUrl,
      createdAt: messagesTable.createdAt,
    })
    .from(messagesTable)
    .innerJoin(usersTable, eq(messagesTable.userId, usersTable.id))
    .where(conditions)
    .orderBy(desc(messagesTable.createdAt))
    .limit(limit);

  if (msgs.length === 0) return [];

  const msgIds = msgs.map(m => m.id);
  const reactions = await db
    .select()
    .from(messageReactionsTable)
    .where(sql`${messageReactionsTable.messageId} = ANY(${msgIds}::int[])`);

  const reactionMap = new Map<number, { emoji: string; count: number; userIds: number[] }[]>();
  for (const r of reactions) {
    if (!reactionMap.has(r.messageId)) reactionMap.set(r.messageId, []);
    const arr = reactionMap.get(r.messageId)!;
    const existing = arr.find(x => x.emoji === r.emoji);
    if (existing) {
      existing.count++;
      existing.userIds.push(r.userId);
    } else {
      arr.push({ emoji: r.emoji, count: 1, userIds: [r.userId] });
    }
  }

  return msgs.reverse().map(m => ({
    id: m.id,
    userId: m.userId,
    userName: m.userName,
    userAvatarUrl: m.userAvatarUrl ?? null,
    messageText: m.messageText,
    imageUrl: m.imageUrl ?? null,
    createdAt: m.createdAt.toISOString(),
    reactions: reactionMap.get(m.id) ?? [],
  }));
}

router.get("/messages", requireDbUser, async (req, res): Promise<void> => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const before = req.query.before ? Number(req.query.before) : undefined;
  const messages = await getMessagesWithReactions(limit, before);
  res.json(messages);
});

router.post("/messages", requireDbUser, async (req, res): Promise<void> => {
  const userId = req.dbUserId!;
  const { messageText, imageUrl } = req.body;

  if (!messageText || typeof messageText !== "string") {
    res.status(400).json({ error: "messageText is required" });
    return;
  }

  const [msg] = await db.insert(messagesTable).values({
    userId,
    messageText,
    imageUrl: imageUrl ?? null,
  }).returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  const others = await db.select({ id: usersTable.id }).from(usersTable).where(
    sql`${usersTable.id} != ${userId}`
  );
  if (others.length > 0) {
    await db.insert(notificationsTable).values(
      others.map((u: { id: number }) => ({
        userId: u.id,
        type: "message",
        message: `${user.name}: ${messageText.slice(0, 50)}${messageText.length > 50 ? "..." : ""}`,
      }))
    );
  }

  res.status(201).json({
    id: msg.id,
    userId: msg.userId,
    userName: user.name,
    userAvatarUrl: user.avatarUrl ?? null,
    messageText: msg.messageText,
    imageUrl: msg.imageUrl ?? null,
    createdAt: msg.createdAt.toISOString(),
    reactions: [],
  });
});

router.delete("/messages/:id", requireDbUser, async (req, res): Promise<void> => {
  const userId = req.dbUserId!;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [msg] = await db.select().from(messagesTable).where(eq(messagesTable.id, id));
  if (!msg) {
    res.status(404).json({ error: "Message not found" });
    return;
  }
  if (msg.userId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.delete(messagesTable).where(eq(messagesTable.id, id));
  res.sendStatus(204);
});

router.post("/messages/:id/reactions", requireDbUser, async (req, res): Promise<void> => {
  const userId = req.dbUserId!;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const messageId = parseInt(raw, 10);
  const { emoji } = req.body;

  if (!emoji) {
    res.status(400).json({ error: "emoji is required" });
    return;
  }

  const [existing] = await db.select()
    .from(messageReactionsTable)
    .where(and(
      eq(messageReactionsTable.messageId, messageId),
      eq(messageReactionsTable.userId, userId),
      eq(messageReactionsTable.emoji, emoji)
    ));

  if (existing) {
    await db.delete(messageReactionsTable).where(eq(messageReactionsTable.id, existing.id));
  } else {
    await db.insert(messageReactionsTable).values({ messageId, userId, emoji });
  }

  const allReactions = await db.select()
    .from(messageReactionsTable)
    .where(eq(messageReactionsTable.messageId, messageId));

  const summaryMap = new Map<string, { emoji: string; count: number; userIds: number[] }>();
  for (const r of allReactions) {
    if (!summaryMap.has(r.emoji)) summaryMap.set(r.emoji, { emoji: r.emoji, count: 0, userIds: [] });
    const s = summaryMap.get(r.emoji)!;
    s.count++;
    s.userIds.push(r.userId);
  }

  res.json(Array.from(summaryMap.values()));
});

export default router;
