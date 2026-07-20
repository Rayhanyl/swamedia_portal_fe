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
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center text-foreground">
      <h1 className="text-2xl font-bold">Terjadi kesalahan</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Maaf, terjadi kesalahan tak terduga. Silakan coba lagi.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/80"
      >
        Coba lagi
      </button>
    </main>
  );
}
