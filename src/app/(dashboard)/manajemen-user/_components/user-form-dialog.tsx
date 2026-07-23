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
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { PortalUser } from "@/lib/manajemen-user";
import type { Role } from "@/lib/role";
import { toast } from "@/lib/toast-manager";
import type { ApiResponse } from "@/types/api";

// Satu dialog dua mode:
// - create: userName + nama + email + password (wajib) + role (opsional) →
//   POST /manajemen-user (diteruskan ke WSO2 IS lewat SCIM2).
// - edit: hanya nama + email → PUT /manajemen-user/{subjectId}. Username,
//   password, role, dan status TIDAK diubah di sini (masing-masing punya
//   jalurnya sendiri).
export function UserFormDialog({
  open,
  onOpenChange,
  mode,
  editing,
  roleOptions,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  editing: PortalUser | null;
  roleOptions: Role[];
  onSaved: (user: PortalUser) => void;
}) {
  const [userName, setUserName] = useState("");
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && editing) {
      setNama(editing.nama ?? "");
      setEmail(editing.email ?? "");
    } else {
      setUserName("");
      setNama("");
      setEmail("");
      setPassword("");
      setRoleId(null);
    }
  }, [open, mode, editing]);

  async function handleSave() {
    if (!nama.trim() || !email.trim()) {
      toast.error("Nama dan email wajib diisi");
      return;
    }
    if (mode === "create" && (!userName.trim() || !password)) {
      toast.error("Username dan password awal wajib diisi");
      return;
    }
    if (mode === "create" && password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    setSaving(true);
    try {
      const isCreate = mode === "create";
      const url = isCreate
        ? "/api/proxy/manajemen-user"
        : `/api/proxy/manajemen-user/${editing!.subjectId}`;
      const body = isCreate
        ? {
            userName: userName.trim(),
            email: email.trim(),
            nama: nama.trim(),
            password,
            roleId: roleId,
          }
        : { email: email.trim(), nama: nama.trim() };

      const res = await fetch(url, {
        method: isCreate ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const resBody: ApiResponse<PortalUser> = await res.json();
      if (!res.ok || !resBody.success || !resBody.data) {
        toast.error(resBody.message || "Gagal menyimpan user");
        return;
      }
      onSaved(resBody.data);
      toast.success(
        isCreate ? "User berhasil dibuat" : "Profil user berhasil diperbarui",
      );
      onOpenChange(false);
    } catch {
      toast.error("Tidak dapat menghubungi server");
    } finally {
      setSaving(false);
    }
  }

  const isCreate = mode === "create";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-primary-foreground">
            {isCreate ? "Tambah User" : `Edit Profil — ${editing?.nama ?? ""}`}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="max-h-[70vh] overflow-y-auto">
          {isCreate && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Username <span className="text-destructive">*</span>
              </label>
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="username login (unik di WSO2 IS)"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Nama <span className="text-destructive">*</span>
            </label>
            <Input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Nama tampil"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Email <span className="text-destructive">*</span>
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@swamedia.co.id"
            />
          </div>
          {isCreate && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Password Awal <span className="text-destructive">*</span>
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Role (opsional)</label>
                <SearchableSelect
                  value={roleId}
                  onValueChange={setRoleId}
                  options={roleOptions.map((r) => ({
                    value: r.id,
                    label: r.namaRole,
                  }))}
                  placeholder="Pilih role..."
                />
                <p className="text-muted-foreground text-xs">
                  Tanpa role, user bisa login tapi tak punya izin apa pun —
                  bisa ditetapkan nanti lewat aksi &quot;Atur role&quot;.
                </p>
              </div>
            </>
          )}
          {!isCreate && (
            <p className="text-muted-foreground text-xs">
              Email di sini adalah identitas login WSO2 IS, terpisah dari email
              kontak HR pada data Karyawan — keduanya tidak disinkronkan
              otomatis.
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
            {saving
              ? "Menyimpan..."
              : isCreate
                ? "Buat User"
                : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
