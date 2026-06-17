import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

router.get("/auth/me", requireAuth, (req, res) => {
  const u = req.user;
  res.json({
    id: u.id,
    clerkId: u.supabaseId, // back-compat mapping for frontend
    supabaseId: u.supabaseId,
    name: u.name,
    email: u.email,
    avatarUrl: u.avatarUrl ?? null,
    createdAt: typeof u.createdAt === "string" ? u.createdAt : u.createdAt.toISOString(),
  });
});

export default router;
