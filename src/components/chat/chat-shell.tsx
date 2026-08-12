import type { ReactNode } from "react";

import { MobileNavigation } from "@/components/chat/mobile-navigation";
import { SidebarContent } from "@/components/chat/sidebar-content";

type ChatShellProps = {
  children: ReactNode;
  email: string;
};

export function ChatShell({ children, email }: ChatShellProps) {
  return (
    <div className="chat-theme grid h-dvh min-h-0 grid-cols-1 overflow-hidden bg-background text-foreground md:grid-cols-[240px_minmax(0,1fr)]">
      <aside
        className="hidden min-h-0 border-r border-sidebar-border md:flex"
        aria-label="全局导航"
      >
        <SidebarContent email={email} />
      </aside>
      <div className="relative min-h-0 min-w-0">
        <MobileNavigation>
          <SidebarContent email={email} />
        </MobileNavigation>
        {children}
      </div>
    </div>
  );
}
