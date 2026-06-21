import { Router } from "express";
import { db, votesTable, usersTable, locationsTable, notificationsTable, contributionsTable, submissionLikesTable } from "../db/index.js";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth.js";
import { broadcast } from "../lib/wsServer.js";

const router = Router();

async function broadcastNotification(dbClient, excludeUserId, type, message) {
  try {
    const users = await dbClient.select({ id: usersTable.id }).from(usersTable).where(
      sql`${usersTable.id} != ${excludeUserId}`
    );
    if (users.length > 0) {
      await dbClient.insert(notificationsTable).values(
        users.map((u) => ({ userId: u.id, type, message }))
      );
    }
  } catch (err) {
    console.error("Failed to broadcast notification:", err);
  }
}

router.get("/votes", requireAuth, async (req, res) => {
  const currentUserId = req.dbUserId;
  try {
    const votesData = await db
      .select({
        id: votesTable.id,
        userId: votesTable.userId,
        locationId: votesTable.locationId,
        locationName: locationsTable.name,
        userName: usersTable.name,
        userAvatarUrl: usersTable.avatarUrl,
        timeSlot: votesTable.timeSlot,
        chanda: contributionsTable.amount,
        createdAt: votesTable.createdAt,
      })
      .from(votesTable)
      .innerJoin(usersTable, eq(votesTable.userId, usersTable.id))
      .innerJoin(locationsTable, eq(votesTable.locationId, locationsTable.id))
      .leftJoin(contributionsTable, eq(votesTable.userId, contributionsTable.userId))
      .orderBy(votesTable.createdAt);

    const likesData = await db.select().from(submissionLikesTable);

    const response = votesData.map(v => {
      const submissionLikes = likesData.filter(l => l.targetUserId === v.userId);
      const likesCount = submissionLikes.filter(l => l.type === "like").length;
      const dislikesCount = submissionLikes.filter(l => l.type === "dislike").length;
      const likedByMe = submissionLikes.some(l => l.userId === currentUserId && l.type === "like");
      const dislikedByMe = submissionLikes.some(l => l.userId === currentUserId && l.type === "dislike");

      return {
        id: v.id,
        userId: v.userId,
        locationId: v.locationId,
        locationName: v.locationName,
        userName: v.userName,
        userAvatarUrl: v.userAvatarUrl ?? null,
        timeSlot: v.timeSlot ?? null,
        chanda: v.chanda ? parseFloat(v.chanda) : 0,
        createdAt: typeof v.createdAt === "string" ? v.createdAt : v.createdAt.toISOString(),
        likesCount,
        dislikesCount,
        likedByMe,
        dislikedByMe,
      };
    });

    res.json(response);
  } catch (err) {
    console.error("Failed to fetch votes:", err);
    res.status(500).json({ error: "Failed to fetch votes" });
  }
});

router.get("/votes/my", requireAuth, async (req, res) => {
  const userId = req.dbUserId;
  try {
    const [vote] = await db
      .select({
        id: votesTable.id,
        userId: votesTable.userId,
        locationId: votesTable.locationId,
        locationName: locationsTable.name,
        userName: usersTable.name,
        userAvatarUrl: usersTable.avatarUrl,
        timeSlot: votesTable.timeSlot,
        createdAt: votesTable.createdAt,
      })
      .from(votesTable)
      .innerJoin(usersTable, eq(votesTable.userId, usersTable.id))
      .innerJoin(locationsTable, eq(votesTable.locationId, locationsTable.id))
      .where(eq(votesTable.userId, userId));

    if (!vote) {
      res.json(null);
      return;
    }

    const [contribution] = await db
      .select()
      .from(contributionsTable)
      .where(eq(contributionsTable.userId, userId));

    res.json({
      id: vote.id,
      userId: vote.userId,
      locationId: vote.locationId,
      locationName: vote.locationName,
      userName: vote.userName,
      userAvatarUrl: vote.userAvatarUrl ?? null,
      timeSlot: vote.timeSlot ?? null,
      chanda: contribution ? parseFloat(contribution.amount) : 0,
      createdAt: typeof vote.createdAt === "string" ? vote.createdAt : vote.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("Failed to fetch my vote:", err);
    res.status(500).json({ error: "Failed to fetch my vote" });
  }
});

router.post("/votes", requireAuth, async (req, res) => {
  const userId = req.dbUserId;
  const { locationId, timeSlot, chanda } = req.body;

  if (!locationId) {
    res.status(400).json({ error: "locationId is required" });
    return;
  }

  try {
    const [location] = await db.select().from(locationsTable).where(eq(locationsTable.id, locationId));
    if (!location) {
      res.status(404).json({ error: "Location not found" });
      return;
    }

    const payload = await db.transaction(async (tx) => {
      const [existingVote] = await tx.select().from(votesTable).where(eq(votesTable.userId, userId));
      let vote;
      if (existingVote) {
        const [updated] = await tx.update(votesTable)
          .set({ locationId, timeSlot: timeSlot || null, createdAt: new Date() })
          .where(eq(votesTable.userId, userId))
          .returning();
        vote = updated;
      } else {
        const [created] = await tx.insert(votesTable)
          .values({ userId, locationId, timeSlot: timeSlot || null })
          .returning();
        vote = created;
      }

      const chandaAmount = chanda != null ? String(chanda) : "0";
      const [existingContribution] = await tx.select().from(contributionsTable).where(eq(contributionsTable.userId, userId));
      let contribution;
      if (existingContribution) {
        const [updated] = await tx.update(contributionsTable)
          .set({ amount: chandaAmount, updatedAt: new Date() })
          .where(eq(contributionsTable.userId, userId))
          .returning();
        contribution = updated;
      } else {
        const [created] = await tx.insert(contributionsTable)
          .values({ userId, amount: chandaAmount })
          .returning();
        contribution = created;
      }

      const [user] = await tx.select().from(usersTable).where(eq(usersTable.id, userId));

      return {
        vote,
        contribution,
        user,
      };
    });

    const { vote, contribution, user } = payload;
    await broadcastNotification(db, userId, "vote", `${user.name} voted for ${location.name}`);

    const broadcastPayload = {
      id: vote.id,
      userId: vote.userId,
      locationId: vote.locationId,
      locationName: location.name,
      userName: user.name,
      userAvatarUrl: user.avatarUrl ?? null,
      timeSlot: vote.timeSlot ?? null,
      chanda: parseFloat(contribution.amount),
      createdAt: typeof vote.createdAt === "string" ? vote.createdAt : vote.createdAt.toISOString(),
    };

    broadcast("vote:cast", broadcastPayload);
    broadcast("contribution:updated", {
      id: contribution.id,
      userId: contribution.userId,
      userName: user.name,
      userAvatarUrl: user.avatarUrl ?? null,
      amount: parseFloat(contribution.amount),
      updatedAt: typeof contribution.updatedAt === "string" ? contribution.updatedAt : contribution.updatedAt.toISOString(),
    });

    res.json(broadcastPayload);
  } catch (err) {
    console.error("Failed to cast vote:", err);
    res.status(500).json({ error: "Failed to cast vote" });
  }
});

router.delete("/votes/my", requireAuth, async (req, res) => {
  const userId = req.dbUserId;
  try {
    await db.delete(votesTable).where(eq(votesTable.userId, userId));
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: "Failed to clear vote" });
  }
});

// Toggle/set like
router.post("/submissions/:targetUserId/like", requireAuth, async (req, res) => {
  const userId = req.dbUserId;
  const targetUserId = parseInt(req.params.targetUserId, 10);

  if (isNaN(targetUserId)) {
    res.status(400).json({ error: "Invalid target user ID" });
    return;
  }

  try {
    const [existing] = await db
      .select()
      .from(submissionLikesTable)
      .where(
        sql`${submissionLikesTable.userId} = ${userId} AND ${submissionLikesTable.targetUserId} = ${targetUserId}`
      );

    if (existing) {
      if (existing.type === "like") {
        await db
          .delete(submissionLikesTable)
          .where(
            sql`${submissionLikesTable.userId} = ${userId} AND ${submissionLikesTable.targetUserId} = ${targetUserId}`
          );
        broadcast("submission:reaction_updated", { userId, targetUserId, type: null });
        res.json({ message: "Reaction removed", type: null });
      } else {
        await db
          .update(submissionLikesTable)
          .set({ type: "like" })
          .where(
            sql`${submissionLikesTable.userId} = ${userId} AND ${submissionLikesTable.targetUserId} = ${targetUserId}`
          );
        broadcast("submission:reaction_updated", { userId, targetUserId, type: "like" });
        res.json({ message: "Changed reaction to like", type: "like" });
      }
    } else {
      await db.insert(submissionLikesTable).values({
        userId,
        targetUserId,
        type: "like",
      });
      broadcast("submission:reaction_updated", { userId, targetUserId, type: "like" });
      res.json({ message: "Liked submission", type: "like" });
    }
  } catch (err) {
    console.error("Failed to like submission:", err);
    res.status(500).json({ error: "Failed to update reaction" });
  }
});

// Toggle/set dislike
router.post("/submissions/:targetUserId/dislike", requireAuth, async (req, res) => {
  const userId = req.dbUserId;
  const targetUserId = parseInt(req.params.targetUserId, 10);

  if (isNaN(targetUserId)) {
    res.status(400).json({ error: "Invalid target user ID" });
    return;
  }

  try {
    const [existing] = await db
      .select()
      .from(submissionLikesTable)
      .where(
        sql`${submissionLikesTable.userId} = ${userId} AND ${submissionLikesTable.targetUserId} = ${targetUserId}`
      );

    if (existing) {
      if (existing.type === "dislike") {
        await db
          .delete(submissionLikesTable)
          .where(
            sql`${submissionLikesTable.userId} = ${userId} AND ${submissionLikesTable.targetUserId} = ${targetUserId}`
          );
        broadcast("submission:reaction_updated", { userId, targetUserId, type: null });
        res.json({ message: "Reaction removed", type: null });
      } else {
        await db
          .update(submissionLikesTable)
          .set({ type: "dislike" })
          .where(
            sql`${submissionLikesTable.userId} = ${userId} AND ${submissionLikesTable.targetUserId} = ${targetUserId}`
          );
        broadcast("submission:reaction_updated", { userId, targetUserId, type: "dislike" });
        res.json({ message: "Changed reaction to dislike", type: "dislike" });
      }
    } else {
      await db.insert(submissionLikesTable).values({
        userId,
        targetUserId,
        type: "dislike",
      });
      broadcast("submission:reaction_updated", { userId, targetUserId, type: "dislike" });
      res.json({ message: "Disliked submission", type: "dislike" });
    }
  } catch (err) {
    console.error("Failed to dislike submission:", err);
    res.status(500).json({ error: "Failed to update reaction" });
  }
});

export default router;
