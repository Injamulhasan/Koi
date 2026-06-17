import { Router } from "express";
import { db, contributionsTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireDbUser } from "../middlewares/requireAuth";
import { broadcast } from "../lib/wsServer";

const router = Router();

router.get("/contributions", requireDbUser, async (_req, res): Promise<void> => {
  const contributions = await db
    .select({
      id: contributionsTable.id,
      userId: contributionsTable.userId,
      userName: usersTable.name,
      userAvatarUrl: usersTable.avatarUrl,
      amount: contributionsTable.amount,
      updatedAt: contributionsTable.updatedAt,
    })
    .from(contributionsTable)
    .innerJoin(usersTable, eq(contributionsTable.userId, usersTable.id))
    .orderBy(contributionsTable.updatedAt);

  res.json(contributions.map(c => ({
    id: c.id,
    userId: c.userId,
    userName: c.userName,
    userAvatarUrl: c.userAvatarUrl ?? null,
    amount: parseFloat(c.amount),
    updatedAt: c.updatedAt.toISOString(),
  })));
});

router.put("/contributions/me", requireDbUser, async (req, res): Promise<void> => {
  const userId = req.dbUserId!;
  const { amount } = req.body;

  if (amount == null || isNaN(Number(amount))) {
    res.status(400).json({ error: "amount is required and must be a number" });
    return;
  }

  const [existing] = await db.select().from(contributionsTable).where(eq(contributionsTable.userId, userId));

  let contribution;
  if (existing) {
    const [updated] = await db.update(contributionsTable)
      .set({ amount: String(amount), updatedAt: new Date() })
      .where(eq(contributionsTable.userId, userId))
      .returning();
    contribution = updated;
  } else {
    const [created] = await db.insert(contributionsTable).values({ userId, amount: String(amount) }).returning();
    contribution = created;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const others = await db.select({ id: usersTable.id }).from(usersTable).where(
    sql`${usersTable.id} != ${userId}`
  );
  if (others.length > 0) {
    await db.insert(notificationsTable).values(
      others.map((u: { id: number }) => ({
        userId: u.id,
        type: "contribution",
        message: `${user.name} updated their contribution to ৳${amount}`,
      }))
    );
  }

  const payload = {
    id: contribution.id,
    userId: contribution.userId,
    userName: user.name,
    userAvatarUrl: user.avatarUrl ?? null,
    amount: parseFloat(contribution.amount),
    updatedAt: contribution.updatedAt.toISOString(),
  };
  broadcast("contribution:updated", payload);
  res.json(payload);
});

export default router;
