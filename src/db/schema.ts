import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("user_profile", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
});
