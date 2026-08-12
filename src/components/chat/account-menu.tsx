"use client";

import Link from "next/link";
import { LogOutIcon, MoreHorizontalIcon, UserRoundIcon } from "lucide-react";

import { logoutAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AccountMenuProps = {
  email: string;
};

export function AccountMenu({ email }: AccountMenuProps) {
  return (
    <div className="flex min-h-14 items-center gap-2 px-2">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
        {email.slice(0, 1).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1 truncate text-xs text-foreground">{email}</span>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label="打开账户菜单" />}
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="chat-theme w-48" side="top" align="end" sideOffset={8}>
          <DropdownMenuGroup>
            <DropdownMenuItem render={<Link href="/profile" />}>
              <UserRoundIcon />
              编辑个人资料
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <form action={logoutAction}>
              <DropdownMenuItem
                nativeButton
                render={<button type="submit" className="w-full" />}
                variant="destructive"
              >
                <LogOutIcon />
                退出登录
              </DropdownMenuItem>
            </form>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
