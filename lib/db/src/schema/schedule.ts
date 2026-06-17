import { pgTable, integer, serial, timestamp, text } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const scheduleTable = pgTable("schedule", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  updatedBy: integer("updated_by").references(() => usersTable.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Schedule = typeof scheduleTable.$inferSelect;
