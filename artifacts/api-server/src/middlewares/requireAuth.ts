import type { Request, Response, NextFunction } from "express";
import { db, usersTable, sessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

declare global {
  namespace Express {
    interface Request {
      dbUserId?: number;
      clerkUserId?: string;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const sessionToken = req.cookies?.["session_token"];

  if (!sessionToken) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
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

    req.dbUserId = user.id;
    req.clerkUserId = user.clerkId ?? undefined;
    next();
  } catch (err) {
    logger.error({ err }, "Error in requireAuth middleware");
    res.status(500).json({ error: "Internal server error" });
  }
};

export const requireDbUser = requireAuth;
