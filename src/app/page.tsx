import { redirect } from "next/navigation";

import { getSessionCookies } from "@/lib/auth/session-cookies";

// Entry point: arahkan ke dashboard bila sudah ada sesi, selain itu ke login.
export default async function Home() {
  const { accessToken } = await getSessionCookies();
  redirect(accessToken ? "/dashboard" : "/login");
}
