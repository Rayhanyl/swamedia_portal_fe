"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Ganti dengan pelaporan error (mis. Sentry) bila sudah tersedia.
    console.error(error);
  }, [error]);

  return (
    <main className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-bold">Terjadi kesalahan</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        Maaf, terjadi kesalahan tak terduga. Silakan coba lagi.
      </p>
      <button
        type="button"
        onClick={reset}
        className="bg-primary text-primary-foreground hover:bg-primary/80 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
      >
        Coba lagi
      </button>
    </main>
  );
}
