"use client";

import { useState } from "react";
import { LockIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AkunSaya } from "@/lib/akun-saya";
import type { ApiResponse } from "@/types/api";
import { toast } from "@/lib/toast-manager";

function ProfileField({
  label,
  value,
  onChange,
  readOnly = false,
  type = "text",
  error,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  type?: string;
  error?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[140px_1fr] sm:items-center sm:gap-4">
      <label className="text-muted-foreground text-sm">{label}</label>
      <div>
        <div className="relative">
          <Input
            type={type}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={readOnly}
            aria-invalid={Boolean(error)}
            className={readOnly ? "pr-8" : undefined}
          />
          {readOnly && (
            <LockIcon className="text-muted-foreground absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2" />
          )}
        </div>
        {error && <p className="text-destructive mt-1 text-xs">{error}</p>}
      </div>
    </div>
  );
}

// Nomor telepon tidak boleh mengandung huruf — filter langsung saat mengetik
// (termasuk saat paste, karena tetap lewat onChange) supaya karakter huruf
// tidak pernah masuk ke state, plus dicek lagi sesaat sebelum submit. Regex
// literal baru tiap panggilan (bukan konstanta bersama) supaya flag "g" di
// sanitizeTelepon tidak nyimpan lastIndex yang bisa bikin containsLetter
// salah kalau instance-nya dipakai bergantian.
function sanitizeTelepon(value: string) {
  return value.replace(/[a-zA-Z]/g, "");
}
function containsLetter(value: string) {
  return /[a-zA-Z]/.test(value);
}

// Field yang boleh diedit lewat PUT /api/v1/akun-saya — lihat
// documentation/note/api/02-dashboard-dan-self-service.md#modul-akun-saya.
// Username, Organization, Role Name sengaja read-only (lihat komentar di
// halaman): Username dari klaim id_token, role tetap eksklusif admin.
interface EditableFields {
  firstName: string;
  lastName: string;
  email: string;
  telepon: string;
}

export function AkunSayaForm({
  akun,
  username,
  roleName,
}: {
  akun: AkunSaya | null;
  username: string;
  roleName: string;
}) {
  const [form, setForm] = useState<EditableFields>({
    firstName: akun?.firstName ?? "",
    lastName: akun?.lastName ?? "",
    email: akun?.email ?? "",
    telepon: akun?.telepon ?? "",
  });
  const [teleponError, setTeleponError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  function updateField(key: keyof EditableFields, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleTeleponChange(raw: string) {
    setTeleponError(
      containsLetter(raw)
        ? "Nomor telepon hanya boleh berisi angka"
        : undefined,
    );
    updateField("telepon", sanitizeTelepon(raw));
  }

  async function handleSave() {
    if (containsLetter(form.telepon)) {
      setTeleponError("Nomor telepon hanya boleh berisi angka");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/proxy/akun-saya", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body: ApiResponse<AkunSaya> = await res.json();
      if (!res.ok || !body.success) {
        toast.error(body.message || "Gagal menyimpan data akun");
        return;
      }
      toast.success("Data akun berhasil diperbarui", "Preferensi tersimpan");
    } catch {
      toast.error("Tidak dapat menghubungi server");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="space-y-4">
        <ProfileField label="Username" value={username} readOnly />
        <ProfileField
          label="First Name"
          value={form.firstName}
          onChange={(v) => updateField("firstName", v)}
        />
        <ProfileField
          label="Last Name"
          value={form.lastName}
          onChange={(v) => updateField("lastName", v)}
        />
        <ProfileField
          label="Email"
          value={form.email}
          onChange={(v) => updateField("email", v)}
        />
        <ProfileField
          label="Telephone"
          type="tel"
          value={form.telepon}
          onChange={handleTeleponChange}
          error={teleponError}
        />
        <ProfileField
          label="Organization"
          value={akun?.organization ?? ""}
          readOnly
        />
        <ProfileField label="Role Name" value={roleName} readOnly />
      </div>
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto"
        >
          {saving ? "Menyimpan..." : "Simpan Preferensi"}
        </Button>
      </div>
    </>
  );
}
