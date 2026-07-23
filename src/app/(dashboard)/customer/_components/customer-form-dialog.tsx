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
import {
  JENIS_CUSTOMER_LABEL,
  JENIS_CUSTOMER_VALUES,
  STATUS_PELUANG_LABEL,
  STATUS_PELUANG_VALUES,
  type JenisCustomer,
  type StatusPeluang,
} from "@/lib/customer-status";
import type { Industri } from "@/lib/industri";
import type { KaryawanDropdownItem } from "@/lib/karyawan";
import type { ApiResponse } from "@/types/api";

interface FormState {
  id: number | null;
  nama: string;
  amId: number | null;
  industriId: number | null;
  statusPeluang: StatusPeluang;
  jenisCustomer: JenisCustomer | null;
}

function emptyForm(): FormState {
  return {
    id: null,
    nama: "",
    amId: null,
    industriId: null,
    statusPeluang: "PROSPEK",
    jenisCustomer: null,
  };
}

function formFromCustomer(item: Customer): FormState {
  return {
    id: item.id,
    nama: item.nama,
    amId: item.amId,
    industriId: item.industriId,
    statusPeluang: item.statusPeluang,
    jenisCustomer: item.jenisCustomer,
  };
}

export function CustomerFormDialog({
  open,
  onOpenChange,
  editing,
  industriOptions,
  amOptions,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Customer | null;
  industriOptions: Industri[];
  amOptions: KaryawanDropdownItem[];
  onSaved: (saved: Customer) => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? formFromCustomer(editing) : emptyForm());
  }, [open, editing]);

  async function handleSave() {
    if (!form.nama.trim()) {
      toast.error("Nama customer wajib diisi");
      return;
    }

    setSaving(true);
    try {
      const isEdit = form.id !== null;
      const body = {
        nama: form.nama.trim(),
        amId: form.amId,
        industriId: form.industriId,
        statusPeluang: form.statusPeluang,
        jenisCustomer: form.jenisCustomer,
      };
      const res = await fetch(
        isEdit
          ? `/api/proxy/master/customers/${form.id}`
          : "/api/proxy/master/customers",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const resBody: ApiResponse<Customer> = await res.json();
      if (!res.ok || !resBody.success || !resBody.data) {
        toast.error(resBody.message || "Gagal menyimpan customer");
        return;
      }
      onSaved(resBody.data);
      toast.success(
        isEdit
          ? "Customer berhasil diperbarui"
          : "Customer berhasil ditambahkan",
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
            {form.id === null ? "Tambah Customer Baru" : `Edit Customer`}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Nama Customer <span className="text-destructive">*</span>
            </label>
            <Input
              value={form.nama}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, nama: e.target.value }))
              }
              placeholder="Nama perusahaan customer"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Industri</label>
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
              <label className="text-sm font-medium">Account Manager</label>
              <SearchableSelect
                value={form.amId}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, amId: v }))
                }
                options={amOptions.map((a) => ({
                  value: a.id,
                  label: a.nama,
                }))}
                placeholder="Pilih AM..."
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Status Peluang <span className="text-destructive">*</span>
              </label>
              <SearchableSelect
                value={form.statusPeluang}
                onValueChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    statusPeluang: v ?? prev.statusPeluang,
                  }))
                }
                options={STATUS_PELUANG_VALUES.map((s) => ({
                  value: s,
                  label: STATUS_PELUANG_LABEL[s],
                }))}
                placeholder="Pilih status..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Jenis Customer</label>
              <SearchableSelect
                value={form.jenisCustomer}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, jenisCustomer: v }))
                }
                options={JENIS_CUSTOMER_VALUES.map((j) => ({
                  value: j,
                  label: JENIS_CUSTOMER_LABEL[j],
                }))}
                placeholder="Pilih jenis..."
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
                ? "Simpan Customer"
                : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
