import { redirect } from "next/navigation";

import { getSessionCookies } from "@/lib/auth/session-cookies";

import { DashboardHeader } from "./_components/dashboard-header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { accessToken } = await getSessionCookies();
  if (!accessToken) redirect("/login");

  return (
    <div className="mx-auto max-w-7xl">
      <DashboardHeader />
      {children}
    </div>
  );
}