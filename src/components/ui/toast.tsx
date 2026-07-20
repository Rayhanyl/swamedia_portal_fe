"use client";

import * as React from "react";
import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import { CheckCircle2Icon, XCircleIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { toastManager } from "@/lib/toast-manager";

const TOAST_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  success: CheckCircle2Icon,
  error: XCircleIcon,
};

function ToastViewport({ className, ...props }: ToastPrimitive.Viewport.Props) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        "fixed right-4 bottom-4 z-100 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 outline-none sm:right-6 sm:bottom-6",
        className,
      )}
      {...props}
    />
  );
}

function ToastItem({ toast }: { toast: ToastPrimitive.Root.ToastObject }) {
  const Icon = toast.type ? TOAST_ICONS[toast.type] : undefined;

  return (
    <ToastPrimitive.Root
      data-slot="toast"
      toast={toast}
      className="bg-popover text-popover-foreground ring-foreground/10 data-ending-style:fade-out-0 data-ending-style:slide-out-to-right-4 data-starting-style:fade-in-0 data-starting-style:slide-in-from-bottom-2 data-ending-style:animate-out data-starting-style:animate-in data-[type=error]:ring-destructive/40 pointer-events-auto relative flex w-full items-start gap-3 rounded-xl p-4 pr-9 shadow-lg ring-1 data-[type=success]:ring-emerald-500/30"
    >
      <ToastPrimitive.Content className="flex flex-1 items-start gap-3">
        {Icon && (
          <Icon
            className={cn(
              "mt-0.5 size-5 shrink-0",
              toast.type === "success" &&
                "text-emerald-600 dark:text-emerald-400",
              toast.type === "error" && "text-destructive",
            )}
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {toast.title && (
            <ToastPrimitive.Title className="text-sm font-medium" />
          )}
          <ToastPrimitive.Description className="text-muted-foreground text-sm" />
        </div>
      </ToastPrimitive.Content>
      <ToastPrimitive.Close
        aria-label="Tutup notifikasi"
        className="text-muted-foreground hover:text-foreground absolute top-3 right-3 rounded-md p-0.5 transition-colors"
      >
        <XIcon className="size-4" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}

function Toaster() {
  const { toasts } = ToastPrimitive.useToastManager();

  return (
    <ToastPrimitive.Portal>
      <ToastViewport>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </ToastViewport>
    </ToastPrimitive.Portal>
  );
}

// Titik integrasi tunggal — bungkus root layout dengan ini sekali, lalu
// panggil `toast.success(...)` / `toast.error(...)` (dari lib/toast-manager)
// dari mana saja untuk memicu notifikasi.
function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastPrimitive.Provider toastManager={toastManager}>
      {children}
      <Toaster />
    </ToastPrimitive.Provider>
  );
}

export { ToastProvider };
