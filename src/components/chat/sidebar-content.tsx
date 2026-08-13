import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { AccountMenu } from "@/components/chat/account-menu";
import { Brand } from "@/components/chat/brand";
import { RecentChats, type RecentChat } from "@/components/chat/recent-chats";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type SidebarContentProps = {
  chats: RecentChat[];
  email: string;
};

export function SidebarContent({ chats, email }: SidebarContentProps) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex flex-col gap-2 px-3 pt-4 pb-2">
        <Brand />
        <Button
          render={<Link href="/" />}
          nativeButton={false}
          size="lg"
          className="w-full justify-start"
        >
          <PlusIcon data-icon="inline-start" />
          开启新会话
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-3 py-4">
        <div className="flex flex-col gap-2 pb-4">
          <p className="px-2 text-[11px] font-medium tracking-[0.08em] text-muted-foreground">
            最近聊天
          </p>
          <RecentChats chats={chats} />
        </div>
      </ScrollArea>

      <Separator />
      <div className="px-2 py-1">
        <AccountMenu email={email} />
      </div>
    </div>
  );
}
