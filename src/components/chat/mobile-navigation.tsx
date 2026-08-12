"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { MenuIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type MobileNavigationProps = {
  children: ReactNode;
};

export function MobileNavigation({ children }: MobileNavigationProps) {
  const [open, setOpen] = useState(false);

  function closeAfterNavigation(event: MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("a")) {
      setOpen(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2.5 left-3 md:hidden"
            aria-label="打开导航菜单"
          />
        }
      >
        <MenuIcon />
      </SheetTrigger>
      <SheetContent
        className="chat-theme p-0"
        side="left"
        showCloseButton={false}
        onClickCapture={closeAfterNavigation}
        style={{ width: "min(280px, 84vw)" }}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>导航菜单</SheetTitle>
          <SheetDescription>最近聊天和账户操作</SheetDescription>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}
