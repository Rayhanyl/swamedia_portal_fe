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
import type { Contact } from "@/lib/contact";
import {
  TIPE_KONTAK_LABEL,
  TIPE_KONTAK_VALUES,
  type TipeKontak,
} from "@/lib/contact-status";
import type { Customer } from "@/lib/customer";
import type { ApiResponse } from "@/types/api";

interface FormState {
  id: number | null;
  customerId: number | null;
  nama: string;
  jabatan: string;
  email: string;
  telepon: string;
  tipeKontak: TipeKontak;
}

function emptyForm(defaultCustomerId: number | null): FormState {
  return {
    id: null,
    customerId: defaultCustomerId,
    nama: "",
    jabatan: "",
    email: "",
    telepon: "",
    tipeKontak: "AKTIF",
  };
}

function formFromContact(item: Contact): FormState {
  return {
    id: item.id,
    customerId: item.customerId,
    nama: item.nama,
    jabatan: item.jabatan ?? "",
    email: item.email ?? "",
    telepon: item.telepon ?? "",
    tipeKontak: item.tipeKontak,
  };
}

export function ContactFormDialog({
  open,
  onOpenChange,
  editing,
  defaultCustomerId,
  customerOptions,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Contact | null;
  defaultCustomerId: number | null;
  customerOptions: Customer[];
  onSaved: (saved: Contact) => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm(defaultCustomerId));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? formFromContact(editing) : emptyForm(defaultCustomerId));
  }, [open, editing, defaultCustomerId]);

  async function handleSave() {
    if (!form.customerId) {
      toast.error("Customer wajib dipilih");
      return;
    }
    if (!form.nama.trim()) {
      toast.error("Nama kontak wajib diisi");
      return;
    }

    setSaving(true);
    try {
      const isEdit = form.id !== null;
      const body = {
        customerId: form.customerId,
        nama: form.nama.trim(),
        jabatan: form.jabatan.trim() || null,
        email: form.email.trim() || null,
        telepon: form.telepon.trim() || null,
        tipeKontak: form.tipeKontak,
      };
      const res = await fetch(
        isEdit
          ? `/api/proxy/master/contacts/${form.id}`
          : "/api/proxy/master/contacts",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const resBody: ApiResponse<Contact> = await res.json();
      if (!res.ok || !resBody.success || !resBody.data) {
        toast.error(resBody.message || "Gagal menyimpan kontak");
        return;
      }
      onSaved(resBody.data);
      toast.success(
        isEdit ? "Kontak berhasil diperbarui" : "Kontak berhasil ditambahkan",
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
            {form.id === null ? "Tambah Kontak Baru" : "Edit Kontak"}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
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
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Nama Kontak <span className="text-destructive">*</span>
            </label>
            <Input
              value={form.nama}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, nama: e.target.value }))
              }
              placeholder="Nama kontak person"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Jabatan</label>
              <Input
                value={form.jabatan}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, jabatan: e.target.value }))
                }
                placeholder="mis. IT Manager"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Tipe Kontak <span className="text-destructive">*</span>
              </label>
              <SearchableSelect
                value={form.tipeKontak}
                onValueChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    tipeKontak: v ?? prev.tipeKontak,
                  }))
                }
                options={TIPE_KONTAK_VALUES.map((t) => ({
                  value: t,
                  label: TIPE_KONTAK_LABEL[t],
                }))}
                placeholder="Pilih tipe..."
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="nama@perusahaan.co.id"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Telepon</label>
              <Input
                value={form.telepon}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, telepon: e.target.value }))
                }
                placeholder="021xxxxxxx"
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
                ? "Simpan Kontak"
                : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
