import type { Metadata } from "next";
// import { Poppins } from "next/font/google";
import { Inter } from 'next/font/google';
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { getServerUser } from "@/lib/auth/server-user";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// const poppins = Poppins({
//   subsets: ["latin"],
//   weight: ["300", "400", "500", "600", "700"],
//   variable: "--font-poppins",
// });

export const metadata: Metadata = {
  title: "Swamedia Portal",
  description: "Swamedia Portal - Manajemen Proyek & Revenue",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Re-hydrate klaim user dari sesi (best-effort) untuk mengisi AuthProvider.
  const user = await getServerUser();

  return (
    <html lang="id" className={inter.variable}>
      <body className="font-sans antialiased bg-background text-foreground">
        <AuthProvider initialUser={user}>
          <TooltipProvider>{children}</TooltipProvider>
        </AuthProvider>
      </body>
    </html>
    );
  }
