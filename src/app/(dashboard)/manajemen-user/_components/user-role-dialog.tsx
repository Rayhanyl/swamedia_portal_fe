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
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { PortalUser } from "@/lib/manajemen-user";
import type { Role } from "@/lib/role";
import { toast } from "@/lib/toast-manager";
import type { ApiResponse } from "@/types/api";

// Menetapkan / mencabut role portal (atribut swaportal_role_id di WSO2 IS).
// PENTING: role saat ini TIDAK bisa dibaca lewat modul Manajemen User (tidak
// ikut di-cache), jadi selector selalu mulai kosong dan hanya untuk MENETAPKAN
// nilai baru. Pilih role lalu Simpan untuk mengganti; kosongkan (biarkan null)
// lalu Simpan untuk mencabut role. `roleId` wajib ada di body — `null` adalah
// nilai sah untuk mencabut.
export function UserRoleDialog({
  user,
  roleOptions,
  onOpenChange,
}: {
  user: PortalUser | null;
  roleOptions: Role[];
  onOpenChange: (open: boolean) => void;
}) {
  const [roleId, setRoleId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setRoleId(null);
  }, [user]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/proxy/manajemen-user/${user.subjectId}/role`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roleId }),
        },
      );
      const body: ApiResponse<PortalUser> = await res.json();
      if (!res.ok || !body.success) {
        toast.error(body.message || "Gagal memperbarui role user");
        return;
      }
      toast.success(
        roleId === null
          ? "Role user berhasil dicabut"
          : "Role user berhasil diperbarui",
      );
      onOpenChange(false);
    } catch {
      toast.error("Tidak dapat menghubungi server");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={user !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary-foreground">
            Atur Role — {user?.nama ?? ""}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Role Portal</label>
            <SearchableSelect
              value={roleId}
              onValueChange={setRoleId}
              options={roleOptions.map((r) => ({
                value: r.id,
                label: r.namaRole,
              }))}
              placeholder="Pilih role..."
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Role user saat ini tidak dapat ditampilkan (tidak tersimpan di
            cache lokal). Memilih role lalu menyimpan akan{" "}
            <span className="font-medium">mengganti</span> role. Membiarkan
            kosong lalu menyimpan akan{" "}
            <span className="font-medium">mencabut</span> role user.
          </p>
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
            {saving ? "Menyimpan..." : "Simpan Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
