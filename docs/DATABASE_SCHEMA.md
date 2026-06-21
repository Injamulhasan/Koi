# Database Schema Reference (Drizzle ORM)

This document contains the exact Drizzle ORM schemas used in `backend/src/db/schema.js` and their relational mappings.

---

## 1. Table Definitions

### A. Users Table (`users`)
Stores the platform user identities. It links to the third-party Supabase Auth table via `supabase_id` UUID strings but uses serial integer `id` keys locally.

```javascript
export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  supabaseId: text("supabase_id").unique().notNull(), // maps to auth.users.id UUID in Supabase
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

### B. Locations Table (`locations`)
Maintains the preset hangout/recording options (e.g. "Rafir Chaad", "Saif er Chaad").

```javascript
export const locationsTable = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});
```

### C. Votes Table (`votes`)
Stores current location choices. The combination of `userId` and `unique("one_vote_per_user")` ensures a strict constraint of **one vote per citizen**.

```javascript
export const votesTable = pgTable("votes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  locationId: integer("location_id").notNull().references(() => locationsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("one_vote_per_user").on(t.userId),
]);
```

### D. Schedule Table (`schedule`)
Stores the date and time coordinates for the next recording session. It has a `set null` deletion behavior for the updating user.

```javascript
export const scheduleTable = pgTable("schedule", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  updatedBy: integer("updated_by").references(() => usersTable.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

### E. Messages Table (`messages`)
Stores group chat records.

```javascript
export const messagesTable = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  messageText: text("message_text").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

### F. Message Reactions Table (`message_reactions`)
Tracks emoji reactions mapped to specific chat messages.

```javascript
export const messageReactionsTable = pgTable("message_reactions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => messagesTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  emoji: text("emoji").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

### G. Contributions Table (`contributions`)
Tracks active money in the hangout fund pool. The constraint `unique("one_contribution_per_user")` limits citizens to one contribution balance row.

```javascript
export const contributionsTable = pgTable("contributions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("one_contribution_per_user").on(t.userId),
]);
```

### H. Lending Records Table (`lending_records`)
Lending and borrowing records (IOUs) between citizens.

```javascript
export const lendingRecordsTable = pgTable("lending_records", {
  id: serial("id").primaryKey(),
  lenderId: integer("lender_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  borrowerId: integer("borrower_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  note: text("note"),
  status: text("status").notNull().default("active"), // "active" or "repaid"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  repaidAt: timestamp("repaid_at", { withTimezone: true }),
});
```

### I. Notifications Table (`notifications`)
Tracks system alerts for events like schedule shifts or loan repayments.

```javascript
export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

---

## 2. Integrity & Cascade Policies

All foreign keys in this database enforce strict **relational cascading policies** to prevent orphaned records:

1.  **User Cascade**: When a user is deleted, all their related records are immediately removed:
    *   `votes` -> `onDelete: "cascade"`
    *   `messages` -> `onDelete: "cascade"`
    *   `message_reactions` -> `onDelete: "cascade"`
    *   `contributions` -> `onDelete: "cascade"`
    *   `lending_records` (both as lender or borrower) -> `onDelete: "cascade"`
    *   `notifications` -> `onDelete: "cascade"`
2.  **Location Cascade**: If a location option is removed from the `locations` table, any user votes pointing to that location are automatically removed (`votes.locationId` -> `onDelete: "cascade"`).
3.  **Schedule Nullify**: If a user who last updated the schedule is deleted, the schedule entry is kept, and the `updated_by` column is set to `null` (`schedule.updatedBy` -> `onDelete: "set null"`).
