import { Router } from "express";
import { db, lendingRecordsTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireDbUser } from "../middlewares/requireAuth";
import { broadcast } from "../lib/wsServer";

const router = Router();

async function getLendingWithUsers() {
  const lender = usersTable;
  const borrowerAlias = db.$with("borrower").as(
    db.select().from(usersTable)
  );

  const records = await db
    .select({
      id: lendingRecordsTable.id,
      lenderId: lendingRecordsTable.lenderId,
      borrowerId: lendingRecordsTable.borrowerId,
      amount: lendingRecordsTable.amount,
      note: lendingRecordsTable.note,
      status: lendingRecordsTable.status,
      createdAt: lendingRecordsTable.createdAt,
      repaidAt: lendingRecordsTable.repaidAt,
    })
    .from(lendingRecordsTable)
    .orderBy(lendingRecordsTable.createdAt);

  if (records.length === 0) return [];

  const userIds = [...new Set([...records.map(r => r.lenderId), ...records.map(r => r.borrowerId)])];
  const users = await db.select().from(usersTable).where(
    sql`${usersTable.id} = ANY(${userIds}::int[])`
  );
  const userMap = new Map(users.map(u => [u.id, u]));

  return records.map(r => {
    const lender = userMap.get(r.lenderId);
    const borrower = userMap.get(r.borrowerId);
    return {
      id: r.id,
      lenderId: r.lenderId,
      lenderName: lender?.name ?? "Unknown",
      lenderAvatarUrl: lender?.avatarUrl ?? null,
      borrowerId: r.borrowerId,
      borrowerName: borrower?.name ?? "Unknown",
      borrowerAvatarUrl: borrower?.avatarUrl ?? null,
      amount: parseFloat(r.amount),
      note: r.note ?? null,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      repaidAt: r.repaidAt?.toISOString() ?? null,
    };
  });
}

router.get("/lending", requireDbUser, async (_req, res): Promise<void> => {
  const records = await getLendingWithUsers();
  res.json(records);
});

router.post("/lending", requireDbUser, async (req, res): Promise<void> => {
  const lenderId = req.dbUserId!;
  const { borrowerId, amount, note } = req.body;

  if (!borrowerId || amount == null) {
    res.status(400).json({ error: "borrowerId and amount are required" });
    return;
  }

  const [record] = await db.insert(lendingRecordsTable).values({
    lenderId,
    borrowerId,
    amount: String(amount),
    note: note ?? null,
    status: "active",
  }).returning();

  const [lender] = await db.select().from(usersTable).where(eq(usersTable.id, lenderId));
  const [borrower] = await db.select().from(usersTable).where(eq(usersTable.id, borrowerId));

  const others = await db.select({ id: usersTable.id }).from(usersTable).where(
    sql`${usersTable.id} != ${lenderId}`
  );
  if (others.length > 0) {
    await db.insert(notificationsTable).values(
      others.map((u: { id: number }) => ({
        userId: u.id,
        type: "lending",
        message: `${lender.name} lent ৳${amount} to ${borrower?.name ?? "someone"}`,
      }))
    );
  }

  const newPayload = {
    id: record.id,
    lenderId: record.lenderId,
    lenderName: lender.name,
    lenderAvatarUrl: lender.avatarUrl ?? null,
    borrowerId: record.borrowerId,
    borrowerName: borrower?.name ?? "Unknown",
    borrowerAvatarUrl: borrower?.avatarUrl ?? null,
    amount: parseFloat(record.amount),
    note: record.note ?? null,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    repaidAt: null,
  };
  broadcast("lending:new", newPayload);
  res.status(201).json(newPayload);
});

router.patch("/lending/:id", requireDbUser, async (req, res): Promise<void> => {
  const lenderId = req.dbUserId!;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [record] = await db.select().from(lendingRecordsTable).where(eq(lendingRecordsTable.id, id));
  if (!record) { res.status(404).json({ error: "Not found" }); return; }
  if (record.lenderId !== lenderId) { res.status(403).json({ error: "Forbidden" }); return; }

  const updates: any = {};
  if (req.body.amount != null) updates.amount = String(req.body.amount);
  if (req.body.note !== undefined) updates.note = req.body.note;
  if (req.body.borrowerId != null) updates.borrowerId = req.body.borrowerId;

  const [updated] = await db.update(lendingRecordsTable).set(updates).where(eq(lendingRecordsTable.id, id)).returning();
  const [lender] = await db.select().from(usersTable).where(eq(usersTable.id, lenderId));
  const [borrower] = await db.select().from(usersTable).where(eq(usersTable.id, updated.borrowerId));

  const patchPayload = {
    id: updated.id,
    lenderId: updated.lenderId,
    lenderName: lender.name,
    lenderAvatarUrl: lender.avatarUrl ?? null,
    borrowerId: updated.borrowerId,
    borrowerName: borrower?.name ?? "Unknown",
    borrowerAvatarUrl: borrower?.avatarUrl ?? null,
    amount: parseFloat(updated.amount),
    note: updated.note ?? null,
    status: updated.status,
    createdAt: updated.createdAt.toISOString(),
    repaidAt: updated.repaidAt?.toISOString() ?? null,
  };
  broadcast("lending:updated", patchPayload);
  res.json(patchPayload);
});

router.delete("/lending/:id", requireDbUser, async (req, res): Promise<void> => {
  const lenderId = req.dbUserId!;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [record] = await db.select().from(lendingRecordsTable).where(eq(lendingRecordsTable.id, id));
  if (!record) { res.status(404).json({ error: "Not found" }); return; }
  if (record.lenderId !== lenderId) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.delete(lendingRecordsTable).where(eq(lendingRecordsTable.id, id));
  res.sendStatus(204);
});

router.post("/lending/:id/repaid", requireDbUser, async (req, res): Promise<void> => {
  const lenderId = req.dbUserId!;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [record] = await db.select().from(lendingRecordsTable).where(eq(lendingRecordsTable.id, id));
  if (!record) { res.status(404).json({ error: "Not found" }); return; }
  if (record.lenderId !== lenderId) { res.status(403).json({ error: "Forbidden" }); return; }

  const [updated] = await db.update(lendingRecordsTable)
    .set({ status: "repaid", repaidAt: new Date() })
    .where(eq(lendingRecordsTable.id, id))
    .returning();

  const [lender] = await db.select().from(usersTable).where(eq(usersTable.id, lenderId));
  const [borrower] = await db.select().from(usersTable).where(eq(usersTable.id, updated.borrowerId));

  const others = await db.select({ id: usersTable.id }).from(usersTable).where(
    sql`${usersTable.id} != ${lenderId}`
  );
  if (others.length > 0) {
    await db.insert(notificationsTable).values(
      others.map((u: { id: number }) => ({
        userId: u.id,
        type: "loan_repaid",
        message: `${borrower?.name ?? "Someone"} repaid ৳${record.amount} to ${lender.name}`,
      }))
    );
  }

  const repaidPayload = {
    id: updated.id,
    lenderId: updated.lenderId,
    lenderName: lender.name,
    lenderAvatarUrl: lender.avatarUrl ?? null,
    borrowerId: updated.borrowerId,
    borrowerName: borrower?.name ?? "Unknown",
    borrowerAvatarUrl: borrower?.avatarUrl ?? null,
    amount: parseFloat(updated.amount),
    note: updated.note ?? null,
    status: updated.status,
    createdAt: updated.createdAt.toISOString(),
    repaidAt: updated.repaidAt?.toISOString() ?? null,
  };
  broadcast("lending:updated", repaidPayload);
  res.json(repaidPayload);
});

export default router;
