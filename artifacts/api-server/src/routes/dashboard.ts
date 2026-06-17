import { Router } from "express";
import { db, locationsTable, votesTable, scheduleTable, messagesTable, messageReactionsTable, contributionsTable, lendingRecordsTable, notificationsTable, usersTable } from "@workspace/db";
import { eq, desc, sql, and } from "drizzle-orm";
import { requireDbUser } from "../middlewares/requireAuth";

const router = Router();

router.get("/dashboard/summary", requireDbUser, async (req, res): Promise<void> => {
  const userId = req.dbUserId!;

  const [voteCounts, schedule, recentMsgs, contributionSum, activeLoanCount, unreadCount] = await Promise.all([
    db.select({
      locationId: votesTable.locationId,
      locationName: locationsTable.name,
      count: sql<number>`count(*)::int`,
    })
    .from(votesTable)
    .innerJoin(locationsTable, eq(votesTable.locationId, locationsTable.id))
    .groupBy(votesTable.locationId, locationsTable.name)
    .orderBy(sql`count(*) DESC`),

    db.select({
      id: scheduleTable.id,
      date: scheduleTable.date,
      time: scheduleTable.time,
      updatedBy: scheduleTable.updatedBy,
      updatedByName: usersTable.name,
      updatedAt: scheduleTable.updatedAt,
    })
    .from(scheduleTable)
    .leftJoin(usersTable, eq(scheduleTable.updatedBy, usersTable.id))
    .limit(1),

    db.select({
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
    .orderBy(desc(messagesTable.createdAt))
    .limit(3),

    db.select({ total: sql<number>`coalesce(sum(amount::numeric), 0)::float` }).from(contributionsTable),

    db.select({ count: sql<number>`count(*)::int` }).from(lendingRecordsTable).where(eq(lendingRecordsTable.status, "active")),

    db.select({ count: sql<number>`count(*)::int` }).from(notificationsTable).where(
      and(eq(notificationsTable.userId, userId), eq(notificationsTable.read, false))
    ),
  ]);

  const totalVotes = voteCounts.reduce((sum, v) => sum + v.count, 0);
  const leading = voteCounts[0];

  const msgIds = recentMsgs.map(m => m.id);
  let reactions: any[] = [];
  if (msgIds.length > 0) {
    reactions = await db.select().from(messageReactionsTable).where(
      sql`${messageReactionsTable.messageId} = ANY(${msgIds}::int[])`
    );
  }

  const reactionMap = new Map<number, { emoji: string; count: number; userIds: number[] }[]>();
  for (const r of reactions) {
    if (!reactionMap.has(r.messageId)) reactionMap.set(r.messageId, []);
    const arr = reactionMap.get(r.messageId)!;
    const ex = arr.find((x: any) => x.emoji === r.emoji);
    if (ex) { ex.count++; ex.userIds.push(r.userId); }
    else arr.push({ emoji: r.emoji, count: 1, userIds: [r.userId] });
  }

  const s = schedule[0];

  res.json({
    leadingLocation: leading?.locationName ?? null,
    leadingLocationId: leading?.locationId ?? null,
    leadingLocationVotes: leading?.count ?? 0,
    totalVotes,
    schedule: s ? {
      id: s.id,
      date: s.date,
      time: s.time,
      updatedBy: s.updatedBy ?? null,
      updatedByName: s.updatedByName ?? null,
      updatedAt: s.updatedAt.toISOString(),
    } : null,
    recentMessages: recentMsgs.reverse().map(m => ({
      id: m.id,
      userId: m.userId,
      userName: m.userName,
      userAvatarUrl: m.userAvatarUrl ?? null,
      messageText: m.messageText,
      imageUrl: m.imageUrl ?? null,
      createdAt: m.createdAt.toISOString(),
      reactions: reactionMap.get(m.id) ?? [],
    })),
    totalContributions: contributionSum[0]?.total ?? 0,
    activeLoans: activeLoanCount[0]?.count ?? 0,
    unreadNotifications: unreadCount[0]?.count ?? 0,
  });
});

export default router;
