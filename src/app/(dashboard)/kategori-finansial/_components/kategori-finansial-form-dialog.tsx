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
import { toast } from "@/lib/toast-manager";
import type {
  KategoriFinansialKeluar,
  KategoriFinansialKeluarStatus,
} from "@/lib/kategori-finansial-keluar";
import type { ApiResponse } from "@/types/api";

interface FormState {
  id: number | null;
  kode: string;
  nama: string;
  status: KategoriFinansialKeluarStatus;
}

function emptyForm(): FormState {
  return { id: null, kode: "", nama: "", status: "AKTIF" };
}

function formFromKategori(item: KategoriFinansialKeluar): FormState {
  return {
    id: item.id,
    kode: item.kode,
    nama: item.nama,
    status: item.status,
  };
}

export function KategoriFinansialFormDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: KategoriFinansialKeluar | null;
  onSaved: (saved: KategoriFinansialKeluar) => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? formFromKategori(editing) : emptyForm());
  }, [open, editing]);

  async function handleSave() {
    if (!form.kode.trim() || !form.nama.trim()) {
      toast.error("Kode dan nama kategori wajib diisi");
      return;
    }

    setSaving(true);
    try {
      const isEdit = form.id !== null;
      const res = await fetch(
        isEdit
          ? `/api/proxy/master/kategori-finansial-keluar/${form.id}`
          : "/api/proxy/master/kategori-finansial-keluar",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kode: form.kode.trim(),
            nama: form.nama.trim(),
            status: form.status,
          }),
        },
      );
      const body: ApiResponse<KategoriFinansialKeluar> = await res.json();
      if (!res.ok || !body.success || !body.data) {
        toast.error(body.message || "Gagal menyimpan kategori finansial");
        return;
      }
      onSaved(body.data);
      toast.success(
        isEdit
          ? "Kategori finansial berhasil diperbarui"
          : "Kategori finansial berhasil ditambahkan",
      );
      onOpenChange(false);
    } catch {
      toast.error("Tidak dapat menghubungi server");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-primary-foreground">
            {form.id === null
              ? "Tambah Kategori Finansial"
              : "Edit Kategori Finansial"}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Kode <span className="text-destructive">*</span>
            </label>
            <Input
              value={form.kode}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, kode: e.target.value }))
              }
              placeholder="Contoh: OPS"
              maxLength={20}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Nama Kategori <span className="text-destructive">*</span>
            </label>
            <Input
              value={form.nama}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, nama: e.target.value }))
              }
              placeholder="Nama kategori finansial..."
              maxLength={100}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Status <span className="text-destructive">*</span>
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={form.status === "AKTIF" ? "default" : "outline"}
                onClick={() =>
                  setForm((prev) => ({ ...prev, status: "AKTIF" }))
                }
                className="flex-1"
              >
                Aktif
              </Button>
              <Button
                type="button"
                variant={form.status === "TIDAK_AKTIF" ? "default" : "outline"}
                onClick={() =>
                  setForm((prev) => ({ ...prev, status: "TIDAK_AKTIF" }))
                }
                className="flex-1"
              >
                Tidak Aktif
              </Button>
            </div>
          </div>
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
              : form.id === null
                ? "Simpan Kategori"
                : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
