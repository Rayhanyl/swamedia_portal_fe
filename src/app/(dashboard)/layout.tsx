import { redirect } from "next/navigation";
import { Inter } from "next/font/google";
import "./../globals.css";
import { getSessionCookies } from "@/lib/auth/session-cookies";
import { getMenuSaya } from "@/lib/menu";
import { getNotifikasi, getUnreadCount } from "@/lib/notifikasi";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardBreadcrumb } from "@/components/dashboard-breadcrumb";
import { DashboardUserMenu } from "@/components/dashboard-user-menu";
import { NotificationsMenu } from "@/components/notifications-menu";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) redirect("/login");
  const [menu, notifikasiPage, unreadCount] = await Promise.all([
    getMenuSaya(),
    getNotifikasi({ limit: 3 }),
    getUnreadCount(),
  ]);
  return (
    <div className={inter.variable}>
      <div className="bg-background text-foreground font-sans antialiased">
        <SidebarProvider>
          <AppSidebar menu={menu} />
          <SidebarInset>
            <header className="flex min-h-16 shrink-0 items-center justify-between gap-2 border-b px-4 py-3 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
                <DashboardBreadcrumb menu={menu} />
              </div>
              <div className="flex items-center gap-3">
                <NotificationsMenu
                  initialItems={notifikasiPage.items}
                  initialUnreadCount={unreadCount}
                />
                <Separator orientation="vertical" className="h-6" />
                <DashboardUserMenu />
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              <TooltipProvider>{children}</TooltipProvider>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  );
}
