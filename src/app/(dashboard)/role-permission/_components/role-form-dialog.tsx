"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Role, RoleStatus } from "@/lib/role";
import { toast } from "@/lib/toast-manager";
import { cn } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";

// CRUD role master. Role baru lahir TANPA permission & menu sama sekali —
// setelah dibuat, arahkan admin mengatur Permission & Menu di layar yang sama.
export function RoleFormDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Role | null;
  onSaved: (role: Role, isNew: boolean) => void;
}) {
  const [kodeRole, setKodeRole] = useState("");
  const [namaRole, setNamaRole] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [status, setStatus] = useState<RoleStatus>("AKTIF");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setKodeRole(editing.kodeRole);
      setNamaRole(editing.namaRole);
      setDeskripsi(editing.deskripsi ?? "");
      setStatus(editing.status);
    } else {
      setKodeRole("");
      setNamaRole("");
      setDeskripsi("");
      setStatus("AKTIF");
    }
  }, [open, editing]);

  async function handleSave() {
    if (!kodeRole.trim() || !namaRole.trim()) {
      toast.error("Kode dan nama role wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const isEdit = editing !== null;
      const body = {
        kodeRole: kodeRole.trim(),
        namaRole: namaRole.trim(),
        deskripsi: deskripsi.trim() || null,
        status,
      };
      const res = await fetch(
        isEdit
          ? `/api/proxy/master/roles/${editing!.id}`
          : "/api/proxy/master/roles",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const resBody: ApiResponse<Role> = await res.json();
      if (!res.ok || !resBody.success || !resBody.data) {
        toast.error(resBody.message || "Gagal menyimpan role");
        return;
      }
      onSaved(resBody.data, !isEdit);
      toast.success(isEdit ? "Role berhasil diperbarui" : "Role berhasil dibuat");
      onOpenChange(false);
    } catch {
      toast.error("Tidak dapat menghubungi server");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary-foreground">
            {editing ? `Edit Role — ${editing.namaRole}` : "Tambah Role"}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Kode Role <span className="text-destructive">*</span>
            </label>
            <Input
              value={kodeRole}
              onChange={(e) => setKodeRole(e.target.value)}
              placeholder="mis. FINANCE_STAFF"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Nama Role <span className="text-destructive">*</span>
            </label>
            <Input
              value={namaRole}
              onChange={(e) => setNamaRole(e.target.value)}
              placeholder="mis. Staff Keuangan"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Deskripsi</label>
            <Input
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Deskripsi singkat (opsional)"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Status</label>
            <div className="flex gap-2">
              {(["AKTIF", "TIDAK_AKTIF"] as RoleStatus[]).map((s) => (
                <Button
                  key={s}
                  type="button"
                  size="sm"
                  variant={status === s ? "default" : "outline"}
                  onClick={() => setStatus(s)}
                  className={cn("flex-1")}
                >
                  {s === "AKTIF" ? "Aktif" : "Tidak Aktif"}
                </Button>
              ))}
            </div>
          </div>
          {!editing && (
            <p className="text-muted-foreground text-xs">
              Role baru lahir tanpa izin dan tanpa menu. Setelah dibuat, atur
              Permission &amp; Menu-nya agar user dengan role ini bisa
              melihat/melakukan sesuatu.
            </p>
          )}
        </DialogBody>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Batal
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Buat Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
