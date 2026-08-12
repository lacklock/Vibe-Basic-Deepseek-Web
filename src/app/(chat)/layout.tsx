import type { ReactNode } from "react";

import { ChatShell } from "@/components/chat/chat-shell";
import { requireUser } from "@/lib/auth/require-user";

export default async function ChatLayout({ children }: { children: ReactNode }) {
  const claims = await requireUser();
  const email = typeof claims.email === "string" ? claims.email : "已登录用户";

  return <ChatShell email={email}>{children}</ChatShell>;
}
