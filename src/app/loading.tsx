export default function Loading() {
  return (
    <div className="bg-background text-foreground flex min-h-screen items-center justify-center">
      <div
        className="border-muted border-t-foreground h-8 w-8 animate-spin rounded-full border-2"
        role="status"
        aria-label="Memuat"
      />
    </div>
  );
}
