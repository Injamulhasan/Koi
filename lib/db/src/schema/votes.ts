import { pgTable, integer, serial, timestamp, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { locationsTable } from "./locations";

export const votesTable = pgTable("votes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  locationId: integer("location_id").notNull().references(() => locationsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("one_vote_per_user").on(t.userId),
]);

export type Vote = typeof votesTable.$inferSelect;
