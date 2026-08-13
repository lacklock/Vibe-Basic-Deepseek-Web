import { index, pgSchema, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

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

export const chatsTable = pgTable(
  "chats",
  {
    chatId: uuid("chat_id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    title: varchar({ length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("chats_user_id_created_at_chat_id_idx").on(
      table.userId,
      table.createdAt,
      table.chatId,
    ),
  ],
);

export const messagesTable = pgTable(
  "messages",
  {
    messageId: uuid("message_id").defaultRandom().primaryKey(),
    chatId: uuid("chat_id")
      .notNull()
      .references(() => chatsTable.chatId, { onDelete: "cascade" }),
    role: varchar({ length: 16 }).notNull(),
    content: text().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("messages_chat_id_created_at_message_id_idx").on(
      table.chatId,
      table.createdAt,
      table.messageId,
    ),
  ],
);

export type Chat = typeof chatsTable.$inferSelect;
export type NewChat = typeof chatsTable.$inferInsert;
export type Message = typeof messagesTable.$inferSelect;
export type NewMessage = typeof messagesTable.$inferInsert;
