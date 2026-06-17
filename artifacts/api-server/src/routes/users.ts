import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/users/me", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = req.clerkUserId!;

  let [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkUserId));

  if (!user) {
    res.status(404).json({ error: "User profile not found" });
    return;
  }

  res.json({
    id: user.id,
    clerkId: user.clerkId,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
    createdAt: user.createdAt.toISOString(),
  });
});

router.put("/users/me", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = req.clerkUserId!;
  const { name, avatarUrl } = req.body;

  let [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkUserId));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const updates: Partial<typeof user> = {};
  if (name != null) updates.name = name;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.clerkId, clerkUserId)).returning();
  res.json({
    id: updated.id,
    clerkId: updated.clerkId,
    name: updated.name,
    email: updated.email,
    avatarUrl: updated.avatarUrl ?? null,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.post("/users/sync", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = req.clerkUserId!;
  const { name, email, avatarUrl } = req.body;

  if (!name || !email) {
    res.status(400).json({ error: "name and email are required" });
    return;
  }

  let [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkUserId));

  if (!user) {
    const [created] = await db.insert(usersTable).values({
      clerkId: clerkUserId,
      name,
      email,
      avatarUrl: avatarUrl ?? null,
    }).returning();
    user = created;
  }

  res.json({
    id: user.id,
    clerkId: user.clerkId,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
    createdAt: user.createdAt.toISOString(),
  });
});

router.get("/users", requireAuth, async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.name);
  res.json(users.map(u => ({
    id: u.id,
    clerkId: u.clerkId,
    name: u.name,
    email: u.email,
    avatarUrl: u.avatarUrl ?? null,
    createdAt: u.createdAt.toISOString(),
  })));
});

export default router;
