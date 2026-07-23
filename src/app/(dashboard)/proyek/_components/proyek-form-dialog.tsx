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
import type { Customer } from "@/lib/customer";
import type { Industri } from "@/lib/industri";
import type { KaryawanDropdownItem } from "@/lib/karyawan";
import type { KontrakBiasaDropdownItem } from "@/lib/kontrak-biasa";
import type { Proyek, ProyekEligibleUnit } from "@/lib/proyek";
import {
  PROYEK_STATUS_LABEL,
  PROYEK_STATUS_VALUES,
  type ProyekStatus,
} from "@/lib/proyek-status";
import type { ApiResponse } from "@/types/api";

interface FormState {
  id: number | null;
  kodeProyek: string;
  customerId: number | null;
  industriId: number | null;
  unitId: number | null;
  unitNama: string;
  namaProyek: string;
  status: ProyekStatus;
  statusKomentar: string;
  picSalesId: number | null;
  tanggalMulai: string;
  tahun: number;
  nilaiProyek: string;
  subkon: string;
  kontrakBiasaId: number | null;
  keteranganPembayaran: string;
}

function emptyForm(tahun: number): FormState {
  return {
    id: null,
    kodeProyek: "",
    customerId: null,
    industriId: null,
    unitId: null,
    unitNama: "",
    namaProyek: "",
    status: "INFO_PELUANG",
    statusKomentar: "",
    picSalesId: null,
    tanggalMulai: "",
    tahun,
    nilaiProyek: "",
    subkon: "0",
    kontrakBiasaId: null,
    keteranganPembayaran: "",
  };
}

function formFromProyek(item: Proyek): FormState {
  return {
    id: item.id,
    kodeProyek: item.kodeProyek,
    customerId: item.customerId,
    industriId: item.industriId,
    unitId: item.unitId,
    unitNama: item.unitNama ?? "",
    namaProyek: item.namaProyek,
    status: item.status,
    statusKomentar: "",
    picSalesId: item.picSalesId,
    tanggalMulai: item.tanggalMulai ?? "",
    tahun: item.tahun,
    nilaiProyek: String(item.nilaiProyek),
    subkon: String(item.subkon),
    kontrakBiasaId: item.kontrakBiasaId,
    keteranganPembayaran: item.keteranganPembayaran ?? "",
  };
}

function formatRupiah(value: number) {
  return `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;
}

// Dialog Tambah/Edit Proyek — dipakai baik dari list (Daftar Sales Unit)
// maupun dari halaman Detail Proyek (tombol "Edit Proyek"), supaya logika
// form & validasi tidak terduplikasi di dua tempat.
export function ProyekFormDialog({
  open,
  onOpenChange,
  editing,
  defaultTahun,
  customerOptions,
  industriOptions,
  eligibleUnitOptions,
  picOptions,
  kontrakBiasaOptions,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Proyek | null;
  defaultTahun: number;
  customerOptions: Customer[];
  industriOptions: Industri[];
  eligibleUnitOptions: ProyekEligibleUnit[];
  picOptions: KaryawanDropdownItem[];
  kontrakBiasaOptions: KontrakBiasaDropdownItem[];
  onSaved: (saved: Proyek) => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm(defaultTahun));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? formFromProyek(editing) : emptyForm(defaultTahun));
  }, [open, editing, defaultTahun]);

  async function handleSave() {
    if (!form.customerId || !form.industriId || !form.unitId) {
      toast.error("Customer, industri, dan unit organisasi wajib dipilih");
      return;
    }
    if (!form.namaProyek.trim()) {
      toast.error("Nama/deskripsi proyek wajib diisi");
      return;
    }
    if (!form.picSalesId) {
      toast.error("PIC Sales Eksekutif wajib dipilih");
      return;
    }
    const nilaiProyekNum = Number(form.nilaiProyek);
    const subkonNum = Number(form.subkon || "0");
    if (!nilaiProyekNum || nilaiProyekNum <= 0) {
      toast.error("Nilai proyek wajib diisi dan lebih besar dari 0");
      return;
    }
    if (subkonNum < 0 || subkonNum > nilaiProyekNum) {
      toast.error("Nilai subkon tidak boleh melebihi nilai proyek");
      return;
    }

    setSaving(true);
    try {
      const isEdit = form.id !== null;
      const body = {
        customerId: form.customerId,
        industriId: form.industriId,
        namaProyek: form.namaProyek.trim(),
        nilaiProyek: nilaiProyekNum,
        subkon: subkonNum,
        picSalesId: form.picSalesId,
        tanggalMulai: form.tanggalMulai || null,
        kontrakBiasaId: form.kontrakBiasaId,
        keteranganPembayaran: form.keteranganPembayaran.trim() || null,
        status: form.status,
        ...(isEdit
          ? { statusKomentar: form.statusKomentar.trim() || null }
          : { unitId: form.unitId, tahun: form.tahun }),
      };
      const res = await fetch(
        isEdit
          ? `/api/proxy/business/proyek/${form.id}`
          : "/api/proxy/business/proyek",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const resBody: ApiResponse<Proyek> = await res.json();
      if (!res.ok || !resBody.success || !resBody.data) {
        toast.error(resBody.message || "Gagal menyimpan proyek");
        return;
      }
      onSaved(resBody.data);
      toast.success(
        isEdit ? "Proyek berhasil diperbarui" : "Proyek berhasil ditambahkan",
      );
      onOpenChange(false);
    } catch {
      toast.error("Tidak dapat menghubungi server");
    } finally {
      setSaving(false);
    }
  }

  const nilaiProyekPreview = Number(form.nilaiProyek) || 0;
  const subkonPreview = Number(form.subkon) || 0;
  const nilaiBersihPreview = nilaiProyekPreview - subkonPreview;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-primary-foreground">
            {form.id === null
              ? "Tambah Proyek Baru"
              : `Edit Proyek — ${form.kodeProyek}`}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="max-h-[70vh] overflow-y-auto">
          <div className="space-y-3">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Identitas Proyek
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Kode Proyek</label>
                <div className="border-input bg-muted/40 text-muted-foreground flex h-8 items-center rounded-lg border px-2.5 text-sm">
                  {form.id === null
                    ? "Dibuat otomatis oleh sistem"
                    : form.kodeProyek}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Customer <span className="text-destructive">*</span>
                </label>
                <SearchableSelect
                  value={form.customerId}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, customerId: v }))
                  }
                  options={customerOptions.map((c) => ({
                    value: c.id,
                    label: c.nama,
                  }))}
                  placeholder="Pilih customer..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Industri <span className="text-destructive">*</span>
                </label>
                <SearchableSelect
                  value={form.industriId}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, industriId: v }))
                  }
                  options={industriOptions.map((i) => ({
                    value: i.id,
                    label: i.nama,
                  }))}
                  placeholder="Pilih industri..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Unit Organisasi <span className="text-destructive">*</span>
                </label>
                {form.id === null ? (
                  <SearchableSelect
                    value={form.unitId}
                    onValueChange={(v) => {
                      const selected = eligibleUnitOptions.find(
                        (u) => u.id === v,
                      );
                      setForm((prev) => ({
                        ...prev,
                        unitId: selected?.id ?? null,
                        unitNama: selected?.namaUnit ?? "",
                      }));
                    }}
                    options={eligibleUnitOptions.map((u) => ({
                      value: u.id,
                      label: u.namaUnit,
                    }))}
                    placeholder="Pilih unit..."
                  />
                ) : (
                  <div className="border-input bg-muted/40 text-muted-foreground flex h-8 items-center rounded-lg border px-2.5 text-sm">
                    {form.unitNama}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Nama / Deskripsi Proyek{" "}
                <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.namaProyek}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, namaProyek: e.target.value }))
                }
                placeholder="Nama atau deskripsi singkat proyek"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Status Tahapan <span className="text-destructive">*</span>
              </label>
              <SearchableSelect
                value={form.status}
                onValueChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    status: v ?? prev.status,
                  }))
                }
                options={PROYEK_STATUS_VALUES.map((s) => ({
                  value: s,
                  label: PROYEK_STATUS_LABEL[s],
                }))}
                placeholder="Pilih status..."
              />
            </div>
            {form.id !== null && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Komentar Perubahan Status (opsional)
                </label>
                <Input
                  value={form.statusKomentar}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      statusKomentar: e.target.value,
                    }))
                  }
                  placeholder="Dicatat ke riwayat status bila status berubah..."
                />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              PIC &amp; Waktu
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  PIC Sales Eksekutif{" "}
                  <span className="text-destructive">*</span>
                </label>
                <SearchableSelect
                  value={form.picSalesId}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, picSalesId: v }))
                  }
                  options={picOptions.map((p) => ({
                    value: p.id,
                    label: p.nama,
                  }))}
                  placeholder="Pilih PIC..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tanggal Mulai</label>
                <Input
                  type="date"
                  value={form.tanggalMulai}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      tanggalMulai: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Tahun <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  value={form.tahun}
                  disabled={form.id !== null}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      tahun: Number(e.target.value) || prev.tahun,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Nilai Proyek
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Nilai Proyek (Rp) <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <span className="text-muted-foreground absolute top-1/2 left-2.5 -translate-y-1/2 text-sm">
                    Rp
                  </span>
                  <Input
                    type="number"
                    min="0"
                    value={form.nilaiProyek}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        nilaiProyek: e.target.value,
                      }))
                    }
                    placeholder="0"
                    className="pl-7"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nilai Subkon (Rp)</label>
                <div className="relative">
                  <span className="text-muted-foreground absolute top-1/2 left-2.5 -translate-y-1/2 text-sm">
                    Rp
                  </span>
                  <Input
                    type="number"
                    min="0"
                    value={form.subkon}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, subkon: e.target.value }))
                    }
                    placeholder="0"
                    className="pl-7"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 p-3 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <div>
                <p className="text-xs font-semibold">
                  Nilai Bersih (dihitung otomatis)
                </p>
                <p className="text-[11px] opacity-80">
                  = Nilai Proyek − Nilai Subkon
                </p>
              </div>
              <p className="font-semibold whitespace-nowrap">
                {formatRupiah(nilaiBersihPreview)}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Referensi &amp; Keterangan
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Kontrak Biasa (opsional)
              </label>
              <SearchableSelect
                value={form.kontrakBiasaId}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, kontrakBiasaId: v }))
                }
                options={kontrakBiasaOptions.map((k) => ({
                  value: k.id,
                  label: `${k.noKontrakBiasa} — ${k.namaKontrak}`,
                }))}
                placeholder="Tidak ada kontrak biasa"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Keterangan Pembayaran (opsional)
              </label>
              <textarea
                value={form.keteranganPembayaran}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    keteranganPembayaran: e.target.value,
                  }))
                }
                placeholder="Catatan pembayaran, mis. skema termin..."
                rows={2}
                className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:ring-3"
              />
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
                ? "Simpan Proyek"
                : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
