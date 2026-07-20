"use client";

import { usePathname } from "next/navigation";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { resolveMenuIcon } from "@/lib/menu-icon";
import type { MenuItem } from "@/types/menu";
import { ChevronRightIcon } from "lucide-react";

function containsPath(item: MenuItem, pathname: string): boolean {
  if (item.path === pathname) return true;
  return item.children.some((child) => containsPath(child, pathname));
}

function MenuItemRow({ item, pathname }: { item: MenuItem; pathname: string }) {
  const Icon = resolveMenuIcon(item.icon);
  const isActive = containsPath(item, pathname);

  if (item.children.length === 0) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={item.namaMenu}
          isActive={isActive}
          render={<a href={item.path ?? "#"} />}
        >
          <Icon />
          <span>{item.namaMenu}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible
      defaultOpen={isActive}
      className="group/collapsible"
      render={<SidebarMenuItem />}
    >
      <CollapsibleTrigger
        render={
          <SidebarMenuButton tooltip={item.namaMenu} isActive={isActive} />
        }
      >
        <Icon />
        <span>{item.namaMenu}</span>
        <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub>
          {item.children.map((subItem) => {
            const SubIcon = resolveMenuIcon(subItem.icon);
            return (
              <SidebarMenuSubItem key={subItem.id}>
                <SidebarMenuSubButton
                  isActive={pathname === subItem.path}
                  render={<a href={subItem.path ?? "#"} />}
                >
                  <SubIcon />
                  <span>{subItem.namaMenu}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function NavMain({ items }: { items: MenuItem[] }) {
  const pathname = usePathname();

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      {items.map((group) => (
        <SidebarGroup key={group.id}>
          {group.children.length > 0 && (
            <SidebarGroupLabel>{group.namaMenu}</SidebarGroupLabel>
          )}
          <SidebarMenu>
            {group.children.length > 0 ? (
              group.children.map((item) => (
                <MenuItemRow key={item.id} item={item} pathname={pathname} />
              ))
            ) : (
              <MenuItemRow item={group} pathname={pathname} />
            )}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}
