import { pgTable, integer, serial, timestamp, numeric, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const contributionsTable = pgTable("contributions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("one_contribution_per_user").on(t.userId),
]);

export type Contribution = typeof contributionsTable.$inferSelect;
