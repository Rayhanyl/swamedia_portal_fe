import Link from "next/link";

export default function NotFound() {
  return (
    <main className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-muted-foreground/30 text-5xl font-extrabold">404</p>
      <h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        Halaman yang Anda cari tidak tersedia atau telah dipindahkan.
      </p>
      <Link
        href="/dashboard"
        className="bg-primary text-primary-foreground hover:bg-primary/80 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
      >
        Kembali ke dashboard
      </Link>
    </main>
  );
}
