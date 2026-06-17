import { Router } from "express";
import { db, scheduleTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireDbUser } from "../middlewares/requireAuth";
import { broadcast } from "../lib/wsServer";

const router = Router();

router.get("/schedule", requireDbUser, async (_req, res): Promise<void> => {
  const [schedule] = await db
    .select({
      id: scheduleTable.id,
      date: scheduleTable.date,
      time: scheduleTable.time,
      updatedBy: scheduleTable.updatedBy,
      updatedByName: usersTable.name,
      updatedAt: scheduleTable.updatedAt,
    })
    .from(scheduleTable)
    .leftJoin(usersTable, eq(scheduleTable.updatedBy, usersTable.id))
    .orderBy(scheduleTable.id)
    .limit(1);

  if (!schedule) {
    res.json(null);
    return;
  }

  res.json({
    id: schedule.id,
    date: schedule.date,
    time: schedule.time,
    updatedBy: schedule.updatedBy ?? null,
    updatedByName: schedule.updatedByName ?? null,
    updatedAt: schedule.updatedAt.toISOString(),
  });
});

router.put("/schedule", requireDbUser, async (req, res): Promise<void> => {
  const userId = req.dbUserId!;
  const { date, time } = req.body;

  if (!date || !time) {
    res.status(400).json({ error: "date and time are required" });
    return;
  }

  const [existing] = await db.select().from(scheduleTable).limit(1);

  let schedule;
  if (existing) {
    const [updated] = await db.update(scheduleTable)
      .set({ date, time, updatedBy: userId, updatedAt: new Date() })
      .where(eq(scheduleTable.id, existing.id))
      .returning();
    schedule = updated;
  } else {
    const [created] = await db.insert(scheduleTable).values({ date, time, updatedBy: userId }).returning();
    schedule = created;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const users = await db.select({ id: usersTable.id }).from(usersTable).where(
    sql`${usersTable.id} != ${userId}`
  );
  if (users.length > 0) {
    await db.insert(notificationsTable).values(
      users.map((u: { id: number }) => ({
        userId: u.id,
        type: "schedule_update",
        message: `${user.name} updated the hangout schedule to ${date} at ${time}`,
      }))
    );
  }

  const payload = {
    id: schedule.id,
    date: schedule.date,
    time: schedule.time,
    updatedBy: schedule.updatedBy ?? null,
    updatedByName: user.name,
    updatedAt: schedule.updatedAt.toISOString(),
  };
  broadcast("schedule:updated", payload);
  res.json(payload);
});

export default router;
