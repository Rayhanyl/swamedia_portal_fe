"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { GalleryVerticalEndIcon } from "lucide-react";
import type { MenuItem } from "@/types/menu";
import type { ApiResponse } from "@/types/api";
import { useAuth } from "@/context/auth-context";
import { getUserDisplay } from "@/lib/auth/user-display";

// Data tim/projects masih placeholder shadcn (belum ada API-nya).
const data = {
  teams: [
    {
      name: "PT Swamedia Informatika",
      logo: <GalleryVerticalEndIcon />,
      plan: "Swaportal - App",
    },
  ],
};

// Sesaat setelah login, backend kadang menolak percobaan pertama ke
// menu-saya (token baru belum dikenali) padahal token-nya valid — percobaan
// berikutnya berhasil sendiri. getMenuSaya() di server hanya coba sekali
// (lihat lib/menu.ts) supaya render dashboard tidak nge-block; kalau hasilnya
// kosong, di sini kita minta /api/menu-saya — rute itu sendiri yang retry
// berkali-kali di server sampai berhasil/menyerah (lihat komentarnya), jadi
// dari sini cukup SATU fetch, tidak perlu loop lagi.
function useMenuWithBackgroundRetry(initialMenu: MenuItem[]) {
  const [menu, setMenu] = React.useState(initialMenu);

  React.useEffect(() => {
    if (menu.length > 0) return;

    let cancelled = false;
    async function retry() {
      try {
        const res = await fetch("/api/menu-saya", { cache: "no-store" });
        const body: ApiResponse<MenuItem[]> = await res.json();
        if (
          !cancelled &&
          res.ok &&
          body.success &&
          (body.data ?? []).length > 0
        ) {
          setMenu(body.data ?? []);
        }
      } catch {
        // diamkan — kalau backend memang bermasalah, user bisa refresh manual
      }
    }
    retry();

    return () => {
      cancelled = true;
    };
  }, [menu.length]);

  return menu;
}

export function AppSidebar({
  menu: initialMenu,
  ...props
}: React.ComponentProps<typeof Sidebar> & { menu: MenuItem[] }) {
  const { user } = useAuth();
  const userDisplay = getUserDisplay(user);
  const menu = useMenuWithBackgroundRetry(initialMenu);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={menu} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
