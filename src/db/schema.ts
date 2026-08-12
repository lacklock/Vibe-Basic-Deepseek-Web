import { pgSchema, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

const authSchema = pgSchema("auth");

export const authUsersTable = authSchema.table("users", {
  id: uuid().primaryKey(),
});

export const usersTable = pgTable("user_profile", {
  id: uuid()
    .primaryKey()
    .references(() => authUsersTable.id, { onDelete: "cascade" }),
  nickname: varchar({ length: 32 }),
  avatar: text(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
