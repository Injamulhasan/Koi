import { pgTable, integer, serial, timestamp, text, numeric } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const lendingRecordsTable = pgTable("lending_records", {
  id: serial("id").primaryKey(),
  lenderId: integer("lender_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  borrowerId: integer("borrower_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  note: text("note"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  repaidAt: timestamp("repaid_at", { withTimezone: true }),
});

export type LendingRecord = typeof lendingRecordsTable.$inferSelect;
