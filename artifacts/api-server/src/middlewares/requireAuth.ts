import { getAuth, clerkClient } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
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
  let clerkUserId = req.headers["x-mock-user-id"] as string;
  if (!clerkUserId) {
    const auth = getAuth(req);
    clerkUserId = auth?.userId || "";
  }

  if (!clerkUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.clerkUserId = clerkUserId;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkUserId));
  if (user) {
    req.dbUserId = user.id;
  }

  next();
};

export const requireDbUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let clerkUserId = req.headers["x-mock-user-id"] as string;
  if (!clerkUserId) {
    const auth = getAuth(req);
    clerkUserId = auth?.userId || "";
  }

  if (!clerkUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.clerkUserId = clerkUserId;

  let [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkUserId));

  if (!user) {
    try {
      if (clerkUserId.startsWith("mock_") || !process.env.CLERK_SECRET_KEY) {
        const plainName = clerkUserId.replace("mock_", "");
        const name = plainName.charAt(0).toUpperCase() + plainName.slice(1);
        const email = `${plainName.toLowerCase()}@mock.com`;
        const avatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(name)}`;

        const [created] = await db
          .insert(usersTable)
          .values({ clerkId: clerkUserId, name, email, avatarUrl })
          .returning();
        user = created;
        logger.info({ clerkUserId, name }, "Auto-created DB mock user");
      } else {
        const clerkUser = await clerkClient.users.getUser(clerkUserId);
        const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || "Friend";
        const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
        const avatarUrl = clerkUser.imageUrl ?? null;

        const [created] = await db
          .insert(usersTable)
          .values({ clerkId: clerkUserId, name, email, avatarUrl })
          .returning();
        user = created;
        logger.info({ clerkUserId, name }, "Auto-created DB user from Clerk");
      }
    } catch (err) {
      logger.error({ err, clerkUserId }, "Failed to auto-create user, attempting fallback");
      try {
        const fallbackName = `User ${clerkUserId.substring(0, 8)}`;
        const fallbackEmail = `${clerkUserId}@example.com`;
        const [created] = await db
          .insert(usersTable)
          .values({ clerkId: clerkUserId, name: fallbackName, email: fallbackEmail, avatarUrl: null })
          .returning();
        user = created;
      } catch (innerErr) {
        logger.error({ innerErr, clerkUserId }, "Failed fallback auto-creation of user");
        res.status(500).json({ error: "Failed to provision user account" });
        return;
      }
    }
  }

  req.dbUserId = user.id;
  next();
};
