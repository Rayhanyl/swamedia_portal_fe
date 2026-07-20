"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  GalleryVerticalEndIcon,
  FrameIcon,
  PieChartIcon,
  MapIcon,
} from "lucide-react";
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
// kosong, di sini kita retry di background lewat /api/proxy (rute
// same-origin yang sudah menempelkan cookie sesi) sampai berhasil, tanpa
// user perlu refresh manual.
const BACKGROUND_RETRY_DELAYS_MS = [500, 1000, 2000, 4000];

function useMenuWithBackgroundRetry(initialMenu: MenuItem[]) {
  const [menu, setMenu] = React.useState(initialMenu);

  React.useEffect(() => {
    if (menu.length > 0) return;

    let cancelled = false;
    async function retry() {
      for (const delay of BACKGROUND_RETRY_DELAYS_MS) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        if (cancelled) return;
        try {
          const res = await fetch("/api/proxy/menu-saya", { cache: "no-store" });
          const body: ApiResponse<MenuItem[]> = await res.json();
          if (res.ok && body.success && (body.data ?? []).length > 0) {
            if (!cancelled) setMenu(body.data ?? []);
            return;
          }
        } catch {
          // diamkan, coba lagi di iterasi berikutnya
        }
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
      <SidebarFooter>
        <NavUser user={userDisplay} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
