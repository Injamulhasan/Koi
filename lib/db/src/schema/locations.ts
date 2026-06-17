import { pgTable, text, serial } from "drizzle-orm/pg-core";

export const locationsTable = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export type Location = typeof locationsTable.$inferSelect;
