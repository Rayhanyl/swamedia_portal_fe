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
import type { Pembayaran } from "@/lib/pembayaran";
import type { ProyekDropdownItem } from "@/lib/proyek";
import type { ApiResponse } from "@/types/api";

interface FormState {
  id: number | null;
  proyekId: number | null;
  kategoriId: number | null;
  nilai: string;
  tanggalPengajuan: string;
  tanggalRealisasi: string;
  keterangan: string;
}

function emptyForm(): FormState {
  return {
    id: null,
    proyekId: null,
    kategoriId: null,
    nilai: "",
    tanggalPengajuan: "",
    tanggalRealisasi: "",
    keterangan: "",
  };
}

function formFromPembayaran(item: Pembayaran): FormState {
  return {
    id: item.id,
    proyekId: item.proyekId,
    kategoriId: item.kategoriId,
    nilai: String(item.nilai),
    tanggalPengajuan: item.tanggalPengajuan,
    tanggalRealisasi: item.tanggalRealisasi ?? "",
    keterangan: item.keterangan ?? "",
  };
}

export function PembayaranFormDialog({
  open,
  onOpenChange,
  editing,
  proyekOptions,
  kategoriOptions,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Pembayaran | null;
  proyekOptions: ProyekDropdownItem[];
  kategoriOptions: KategoriFinansialKeluar[];
  onSaved: (saved: Pembayaran) => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? formFromPembayaran(editing) : emptyForm());
  }, [open, editing]);

  async function handleSave() {
    if (!form.proyekId || !form.kategoriId) {
      toast.error("Proyek dan kategori wajib dipilih");
      return;
    }
    const nilaiNum = Number(form.nilai);
    if (!nilaiNum || nilaiNum <= 0) {
      toast.error("Nilai pembayaran wajib diisi dan lebih besar dari 0");
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
        proyekId: form.proyekId,
        kategoriId: form.kategoriId,
        nilai: nilaiNum,
        tanggalPengajuan: form.tanggalPengajuan,
        tanggalRealisasi: form.tanggalRealisasi || null,
        keterangan: form.keterangan.trim() || null,
      };
      const res = await fetch(
        isEdit
          ? `/api/proxy/finance/pembayaran/${form.id}`
          : "/api/proxy/finance/pembayaran",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const resBody: ApiResponse<Pembayaran> = await res.json();
      if (!res.ok || !resBody.success || !resBody.data) {
        toast.error(resBody.message || "Gagal menyimpan pembayaran");
        return;
      }
      onSaved(resBody.data);
      toast.success(
        isEdit
          ? "Pembayaran berhasil diperbarui"
          : "Pembayaran berhasil diajukan",
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
            {form.id === null ? "Ajukan Pembayaran" : "Edit Pembayaran"}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Proyek <span className="text-destructive">*</span>
            </label>
            <SearchableSelect
              value={form.proyekId}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, proyekId: v }))
              }
              options={proyekOptions.map((p) => ({
                value: p.id,
                label: `${p.kodeProyek} — ${p.namaProyek}`,
              }))}
              placeholder="Pilih proyek..."
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
              placeholder="Catatan pembayaran..."
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
                ? "Ajukan Pembayaran"
                : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
