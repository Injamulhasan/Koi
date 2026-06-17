import { Router } from "express";
import { db, contributionsTable, usersTable, notificationsTable } from "../db/index.js";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth.js";
import { broadcast } from "../lib/wsServer.js";

const router = Router();

router.get("/contributions", requireAuth, async (_req, res) => {
  try {
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
      updatedAt: typeof c.updatedAt === "string" ? c.updatedAt : c.updatedAt.toISOString(),
    })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch contributions" });
  }
});

router.put("/contributions/me", requireAuth, async (req, res) => {
  const userId = req.dbUserId;
  const { amount } = req.body;

  if (amount == null || isNaN(Number(amount))) {
    res.status(400).json({ error: "amount is required and must be a number" });
    return;
  }

  try {
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
        others.map((u) => ({
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
      updatedAt: typeof contribution.updatedAt === "string" ? contribution.updatedAt : contribution.updatedAt.toISOString(),
    };
    broadcast("contribution:updated", payload);
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: "Failed to update contribution" });
  }
});

export default router;
