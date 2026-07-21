"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BadgeCheckIcon,
  BellIcon,
  CheckIcon,
  ChevronDownIcon,
  LogOutIcon,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getUserDisplay } from "@/lib/auth/user-display";

export function DashboardUserMenu() {
  const { user, logout } = useAuth();
  const display = getUserDisplay(user);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="hover:bg-muted flex items-center gap-2 rounded-lg px-1.5 py-1 outline-none"
          />
        }
      >
        <Avatar>
          <AvatarImage src={display.avatar} alt={display.name} />
          <AvatarFallback className={display.avatarColorClassName}>
            {display.initials}
          </AvatarFallback>
        </Avatar>
        <div className="hidden text-left leading-tight sm:block">
          <p className="text-sm font-medium">{display.name}</p>
          {display.roleLabel && (
            <Badge className="mt-0.5">{display.roleLabel}</Badge>
          )}
        </div>
        <ChevronDownIcon className="text-muted-foreground size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1.5 py-1.5">
              <Avatar>
                <AvatarImage src={display.avatar} alt={display.name} />
                <AvatarFallback className={display.avatarColorClassName}>
                  {display.initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{display.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {display.email}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        {display.roleLabel && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Lihat sebagai role</DropdownMenuLabel>
              <div className="flex items-center justify-between rounded-md px-1.5 py-1">
                <Badge>{display.roleLabel}</Badge>
                <CheckIcon className="size-4 text-emerald-600" />
              </div>
            </DropdownMenuGroup>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<a href="/profil" />}>
            <BadgeCheckIcon />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem render={<a href="/notifikasi" />}>
            <BellIcon />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()}>
          <LogOutIcon />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
