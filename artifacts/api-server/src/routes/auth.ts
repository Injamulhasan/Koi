import { Router } from "express";
import crypto from "crypto";
import { eq, and } from "drizzle-orm";
import { db, usersTable, sessionsTable } from "@workspace/db";
import { logger } from "../lib/logger";

const router = Router();

// Password hashing helpers
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const testHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === testHash;
}

// 30 days max age
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

router.post("/auth/signup", async (req, res): Promise<void> => {
  try {
    const { email, password, name, avatarUrl } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: "Email, password, and name are required" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, normalizedEmail));

    if (existing) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = hashPassword(password);
    const clerkId = `user_${crypto.randomUUID().replace(/-/g, "")}`;

    // Insert user
    const [user] = await db
      .insert(usersTable)
      .values({
        clerkId,
        email: normalizedEmail,
        name: name.trim(),
        passwordHash,
        avatarUrl: avatarUrl ?? null,
      })
      .returning();

    // Create session
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE);

    await db.insert(sessionsTable).values({
      id: sessionToken,
      userId: user.id,
      expiresAt,
    });

    // Set cookie
    res.cookie("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    res.status(201).json({
      id: user.id,
      clerkId: user.clerkId,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl ?? null,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Signup error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/login", async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, normalizedEmail));

    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Create session
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE);

    await db.insert(sessionsTable).values({
      id: sessionToken,
      userId: user.id,
      expiresAt,
    });

    // Set cookie
    res.cookie("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    res.json({
      id: user.id,
      clerkId: user.clerkId,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl ?? null,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  try {
    const sessionToken = req.cookies?.["session_token"];

    if (sessionToken) {
      // Delete from db
      await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionToken));
    }

    // Clear cookie
    res.clearCookie("session_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Logout error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/auth/me", async (req, res): Promise<void> => {
  try {
    const sessionToken = req.cookies?.["session_token"];

    if (!sessionToken) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.id, sessionToken));

    if (!session || session.expiresAt < new Date()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, session.userId));

    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
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
  } catch (err) {
    logger.error({ err }, "Auth me error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
