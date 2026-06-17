import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "../db/index.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

router.get("/users/me", requireAuth, (req, res) => {
  const u = req.user;
  res.json({
    id: u.id,
    clerkId: u.supabaseId,
    supabaseId: u.supabaseId,
    name: u.name,
    email: u.email,
    avatarUrl: u.avatarUrl ?? null,
    createdAt: typeof u.createdAt === "string" ? u.createdAt : u.createdAt.toISOString(),
  });
});

router.put("/users/me", requireAuth, async (req, res) => {
  const { name, avatarUrl } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

  try {
    const [updated] = await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, req.dbUserId))
      .returning();

    res.json({
      id: updated.id,
      clerkId: updated.supabaseId,
      supabaseId: updated.supabaseId,
      name: updated.name,
      email: updated.email,
      avatarUrl: updated.avatarUrl ?? null,
      createdAt: typeof updated.createdAt === "string" ? updated.createdAt : updated.createdAt.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.post("/users/sync", requireAuth, (req, res) => {
  const u = req.user;
  res.json({
    id: u.id,
    clerkId: u.supabaseId,
    supabaseId: u.supabaseId,
    name: u.name,
    email: u.email,
    avatarUrl: u.avatarUrl ?? null,
    createdAt: typeof u.createdAt === "string" ? u.createdAt : u.createdAt.toISOString(),
  });
});

router.get("/users", requireAuth, async (req, res) => {
  try {
    const users = await db.select().from(usersTable).orderBy(usersTable.name);
    res.json(
      users.map((u) => ({
        id: u.id,
        clerkId: u.supabaseId,
        supabaseId: u.supabaseId,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl ?? null,
        createdAt: typeof u.createdAt === "string" ? u.createdAt : u.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    res.status(500).json({ error: "Failed to list users" });
  }
});

export default router;
