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
import { toast } from "@/lib/toast-manager";
import type { KategoriFinansialKeluar } from "@/lib/kategori-finansial-keluar";
import type { PengeluaranPerusahaan } from "@/lib/pengeluaran-perusahaan";
import type { Unit } from "@/lib/unit";
import type { ApiResponse } from "@/types/api";

interface FormState {
  id: number | null;
  unitId: number | null;
  kategoriId: number | null;
  nilai: string;
  tanggalPengajuan: string;
  tanggalRealisasi: string;
  keterangan: string;
}

function emptyForm(): FormState {
  return {
    id: null,
    unitId: null,
    kategoriId: null,
    nilai: "",
    tanggalPengajuan: "",
    tanggalRealisasi: "",
    keterangan: "",
  };
}

function formFromPengeluaran(item: PengeluaranPerusahaan): FormState {
  return {
    id: item.id,
    unitId: item.unitId,
    kategoriId: item.kategoriId,
    nilai: String(item.nilai),
    tanggalPengajuan: item.tanggalPengajuan,
    tanggalRealisasi: item.tanggalRealisasi ?? "",
    keterangan: item.keterangan ?? "",
  };
}

export function PengeluaranFormDialog({
  open,
  onOpenChange,
  editing,
  unitOptions,
  kategoriOptions,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: PengeluaranPerusahaan | null;
  unitOptions: Unit[];
  kategoriOptions: KategoriFinansialKeluar[];
  onSaved: (saved: PengeluaranPerusahaan) => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? formFromPengeluaran(editing) : emptyForm());
  }, [open, editing]);

  async function handleSave() {
    if (!form.unitId || !form.kategoriId) {
      toast.error("Unit dan kategori wajib dipilih");
      return;
    }
    const nilaiNum = Number(form.nilai);
    if (!nilaiNum || nilaiNum <= 0) {
      toast.error("Nilai pengeluaran wajib diisi dan lebih besar dari 0");
      return;
    }
    if (!form.tanggalPengajuan) {
      toast.error("Tanggal pengajuan wajib diisi");
      return;
    }

    setSaving(true);
    try {
      const isEdit = form.id !== null;
      const body = {
        unitId: form.unitId,
        kategoriId: form.kategoriId,
        nilai: nilaiNum,
        tanggalPengajuan: form.tanggalPengajuan,
        tanggalRealisasi: form.tanggalRealisasi || null,
        keterangan: form.keterangan.trim() || null,
      };
      const res = await fetch(
        isEdit
          ? `/api/proxy/finance/pengeluaran-perusahaan/${form.id}`
          : "/api/proxy/finance/pengeluaran-perusahaan",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const resBody: ApiResponse<PengeluaranPerusahaan> = await res.json();
      if (!res.ok || !resBody.success || !resBody.data) {
        toast.error(resBody.message || "Gagal menyimpan pengeluaran");
        return;
      }
      onSaved(resBody.data);
      toast.success(
        isEdit
          ? "Pengeluaran berhasil diperbarui"
          : "Pengeluaran berhasil diajukan",
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-primary-foreground">
            {form.id === null ? "Ajukan Pengeluaran" : "Edit Pengeluaran"}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Unit <span className="text-destructive">*</span>
            </label>
            <SearchableSelect
              value={form.unitId}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, unitId: v }))
              }
              options={unitOptions.map((u) => ({
                value: u.id,
                label: u.namaUnit,
              }))}
              placeholder="Pilih unit..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Kategori <span className="text-destructive">*</span>
            </label>
            <SearchableSelect
              value={form.kategoriId}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, kategoriId: v }))
              }
              options={kategoriOptions.map((k) => ({
                value: k.id,
                label: k.nama,
              }))}
              placeholder="Pilih kategori..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Nilai (Rp) <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <span className="text-muted-foreground absolute top-1/2 left-2.5 -translate-y-1/2 text-sm">
                Rp
              </span>
              <Input
                type="number"
                min="0"
                value={form.nilai}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, nilai: e.target.value }))
                }
                placeholder="0"
                className="pl-7"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Tanggal Pengajuan <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                value={form.tanggalPengajuan}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    tanggalPengajuan: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Tanggal Realisasi (opsional)
              </label>
              <Input
                type="date"
                value={form.tanggalRealisasi}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    tanggalRealisasi: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Keterangan (opsional)
            </label>
            <textarea
              value={form.keterangan}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, keterangan: e.target.value }))
              }
              placeholder="Catatan pengeluaran..."
              rows={2}
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:ring-3"
            />
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
                ? "Ajukan Pengeluaran"
                : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
