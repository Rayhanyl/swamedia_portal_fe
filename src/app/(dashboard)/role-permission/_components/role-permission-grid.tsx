"use client";

import { useEffect, useState } from "react";
import { Loader2Icon, SaveIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  PermissionScope,
  RolePermissionItem,
  RolePermissionMatrix,
} from "@/lib/role-permission";
import { toast } from "@/lib/toast-manager";
import { cn } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";

// Modul yang punya alur approval — hanya di sini `canApprove` bermakna
// (documentation/note/api/04-rbac.md). Untuk modul lain, checkbox Approve
// dinonaktifkan supaya tidak menyesatkan (backend pun mengabaikannya).
const APPROVAL_MODULES = new Set(["PEMBAYARAN", "PENGELUARAN_PERUSAHAAN"]);

type FlagKey =
  | "canCreate"
  | "canRead"
  | "canUpdate"
  | "canDelete"
  | "canApprove"
  | "canExport";

const FLAG_COLUMNS: { key: FlagKey; label: string }[] = [
  { key: "canCreate", label: "Create" },
  { key: "canRead", label: "Read" },
  { key: "canUpdate", label: "Update" },
  { key: "canDelete", label: "Delete" },
  { key: "canApprove", label: "Approve" },
  { key: "canExport", label: "Export" },
];

export function RolePermissionGrid({ roleId }: { roleId: number }) {
  const [matrix, setMatrix] = useState<RolePermissionMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMatrix(null);
    fetch(`/api/proxy/master/role-permissions/${roleId}`, {
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((body: ApiResponse<RolePermissionMatrix>) => {
        if (cancelled) return;
        if (!body.success || !body.data) {
          toast.error(body.message || "Gagal memuat matriks permission");
          return;
        }
        setMatrix(body.data);
      })
      .catch(() => {
        if (!cancelled) toast.error("Tidak dapat menghubungi server");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [roleId]);

  function updateItem(modulId: number, patch: Partial<RolePermissionItem>) {
    setMatrix((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((it) =>
              it.modulId === modulId ? { ...it, ...patch } : it,
            ),
          }
        : prev,
    );
  }

  async function handleSave() {
    if (!matrix) return;
    setSaving(true);
    try {
      const payload = {
        items: matrix.items.map((it) => ({
          modulId: it.modulId,
          canCreate: it.canCreate,
          canRead: it.canRead,
          canUpdate: it.canUpdate,
          canDelete: it.canDelete,
          canApprove: it.canApprove,
          canExport: it.canExport,
          scope: it.scope,
        })),
      };
      const res = await fetch(
        `/api/proxy/master/role-permissions/${roleId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const body: ApiResponse<RolePermissionMatrix> = await res.json();
      if (!res.ok || !body.success || !body.data) {
        toast.error(body.message || "Gagal menyimpan matriks permission");
        return;
      }
      setMatrix(body.data);
      toast.success("Matriks permission berhasil disimpan");
    } catch {
      toast.error("Tidak dapat menghubungi server");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 p-6 text-sm">
        <Loader2Icon className="size-4 animate-spin" />
        Memuat matriks permission...
      </div>
    );
  }

  if (!matrix) {
    return (
      <p className="text-muted-foreground p-6 text-sm">
        Matriks permission tidak tersedia.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">
          Centang izin per modul. Kolom <b>Approve</b> hanya berlaku untuk
          Pembayaran &amp; Pengeluaran Perusahaan. <b>Scope</b> menentukan
          cakupan data: seluruh data atau hanya unit sendiri.
        </p>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <SaveIcon className="size-4" />
          )}
          Simpan Matriks
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary text-primary-foreground text-left">
              <th className="px-4 py-3 text-xs font-semibold">MODUL</th>
              {FLAG_COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className="px-3 py-3 text-center text-xs font-semibold"
                >
                  {c.label}
                </th>
              ))}
              <th className="px-4 py-3 text-xs font-semibold">SCOPE</th>
            </tr>
          </thead>
          <tbody>
            {matrix.items.map((item) => {
              const approvable = APPROVAL_MODULES.has(item.kodeModul);
              return (
                <tr key={item.modulId} className="border-b last:border-b-0">
                  <td className="px-4 py-2.5 font-medium">{item.namaModul}</td>
                  {FLAG_COLUMNS.map((c) => {
                    const disabled = c.key === "canApprove" && !approvable;
                    return (
                      <td key={c.key} className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          className="size-4 align-middle disabled:opacity-30"
                          checked={item[c.key]}
                          disabled={disabled}
                          title={
                            disabled
                              ? "Approve tidak berlaku untuk modul ini"
                              : undefined
                          }
                          onChange={(e) =>
                            updateItem(item.modulId, {
                              [c.key]: e.target.checked,
                            } as Partial<RolePermissionItem>)
                          }
                        />
                      </td>
                    );
                  })}
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1">
                      {(["ALL", "UNIT_SENDIRI"] as PermissionScope[]).map(
                        (sc) => (
                          <button
                            key={sc}
                            type="button"
                            onClick={() =>
                              updateItem(item.modulId, { scope: sc })
                            }
                            className={cn(
                              "rounded-md border px-2 py-1 text-xs whitespace-nowrap",
                              item.scope === sc
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-input hover:bg-muted",
                            )}
                          >
                            {sc === "ALL" ? "Semua" : "Unit Sendiri"}
                          </button>
                        ),
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-muted-foreground text-xs">
        Menyimpan akan mengganti seluruh matriks dan langsung berlaku pada
        request berikutnya (cache role dibersihkan). Termasuk untuk diri
        sendiri — mencabut izin Role &amp; Permission milik role Anda sendiri
        dapat langsung mengunci Anda dari layar ini.
      </p>
    </div>
  );
}
