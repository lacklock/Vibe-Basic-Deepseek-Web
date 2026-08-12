"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircleIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DemoChat } from "@/lib/chat-demo";

type RecentChatsProps = {
  chats: DemoChat[];
};

export function RecentChats({ chats }: RecentChatsProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="最近聊天" className="flex flex-col gap-1">
      {chats.map((chat) => {
        const href = `/chat/${chat.id}`;
        const isActive = pathname === href;

        return (
          <Link
            key={chat.id}
            href={href}
            title={chat.title}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative flex h-9 items-center gap-2 rounded-xl px-2 text-[13px] text-muted-foreground transition-colors hover:bg-background/80 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              isActive && "bg-accent text-accent-foreground shadow-[inset_2px_0_0_var(--ring)]",
            )}
          >
            <MessageCircleIcon className="size-4 shrink-0 stroke-[1.6]" aria-hidden="true" />
            <span className="truncate">{chat.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
