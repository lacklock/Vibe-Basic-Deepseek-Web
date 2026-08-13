"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircleIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type RecentChat = {
  id: string;
  title: string;
};

type RecentChatsProps = {
  chats: RecentChat[];
};

export function RecentChats({ chats }: RecentChatsProps) {
  const pathname = usePathname();

  if (chats.length === 0) {
    return <p className="px-2 py-2 text-xs text-muted-foreground">暂无聊天记录</p>;
  }

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
