import type { ReactNode } from "react";

import { ChatShell } from "@/components/chat/chat-shell";
import { listChatsByUser } from "@/db/queries/chats";
import { requireUser } from "@/lib/auth/require-user";

export default async function ChatLayout({ children }: { children: ReactNode }) {
  const claims = await requireUser();
  const email = typeof claims.email === "string" ? claims.email : "已登录用户";
  const { items } = await listChatsByUser({ userId: claims.sub, limit: 20 });
  const chats = items.map((chat) => ({ id: chat.chatId, title: chat.title }));

  return (
    <ChatShell chats={chats} email={email}>
      {children}
    </ChatShell>
  );
}
