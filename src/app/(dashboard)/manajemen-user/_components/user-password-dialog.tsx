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
import type { PortalUser } from "@/lib/manajemen-user";
import { toast } from "@/lib/toast-manager";
import type { ApiResponse } from "@/types/api";

// Super Admin reset password user lain (tanpa password lama). Terpisah dari
// edit profil, sesuai pemisahan di API. Minimal 6 karakter. Response
// data null → cukup andalkan 200 sebagai konfirmasi.
export function UserPasswordDialog({
  user,
  onOpenChange,
}: {
  user: PortalUser | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setPassword("");
      setConfirm("");
    }
  }, [user]);

  async function handleSave() {
    if (!user) return;
    if (password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }
    if (password !== confirm) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        `/api/proxy/manajemen-user/${user.subjectId}/password`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        },
      );
      const body: ApiResponse<null> = await res.json();
      if (!res.ok || !body.success) {
        toast.error(body.message || "Gagal reset password");
        return;
      }
      toast.success("Password user berhasil direset");
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
            Reset Password — {user?.nama ?? ""}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Password Baru <span className="text-destructive">*</span>
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Konfirmasi Password <span className="text-destructive">*</span>
            </label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Ulangi password baru"
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Password baru berlaku untuk login berikutnya. Sesi/token yang sudah
            beredar tidak otomatis terputus.
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
            {saving ? "Menyimpan..." : "Reset Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
