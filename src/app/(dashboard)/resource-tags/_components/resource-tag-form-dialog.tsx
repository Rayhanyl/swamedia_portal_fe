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
import type { ResourceTag, ResourceTagStatus } from "@/lib/resource-tags";
import type { Unit } from "@/lib/unit";
import type { ApiResponse } from "@/types/api";

interface FormState {
  id: number | null;
  kode: string;
  nama: string;
  unitId: number | null;
  deskripsi: string;
  status: ResourceTagStatus;
}

function emptyForm(): FormState {
  return {
    id: null,
    kode: "",
    nama: "",
    unitId: null,
    deskripsi: "",
    status: "AKTIF",
  };
}

function formFromResourceTag(item: ResourceTag): FormState {
  return {
    id: item.id,
    kode: item.kode,
    nama: item.nama,
    unitId: item.unitId,
    deskripsi: item.deskripsi ?? "",
    status: item.status,
  };
}

export function ResourceTagFormDialog({
  open,
  onOpenChange,
  editing,
  unitOptions,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: ResourceTag | null;
  unitOptions: Unit[];
  onSaved: (saved: ResourceTag) => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? formFromResourceTag(editing) : emptyForm());
  }, [open, editing]);

  async function handleSave() {
    if (!form.kode.trim() || !form.nama.trim()) {
      toast.error("Kode dan nama tag wajib diisi");
      return;
    }

    setSaving(true);
    try {
      const isEdit = form.id !== null;
      const body = {
        kode: form.kode.trim(),
        nama: form.nama.trim(),
        unitId: form.unitId,
        deskripsi: form.deskripsi.trim() || null,
        status: form.status,
      };
      const res = await fetch(
        isEdit
          ? `/api/proxy/master/resource-tags/${form.id}`
          : "/api/proxy/master/resource-tags",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const resBody: ApiResponse<ResourceTag> = await res.json();
      if (!res.ok || !resBody.success || !resBody.data) {
        toast.error(resBody.message || "Gagal menyimpan resource tag");
        return;
      }
      onSaved(resBody.data);
      toast.success(
        isEdit
          ? "Resource tag berhasil diperbarui"
          : "Resource tag berhasil ditambahkan",
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
            {form.id === null ? "Tambah Resource Tag" : "Edit Resource Tag"}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Kode <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.kode}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, kode: e.target.value }))
                }
                placeholder="Kode unik, mis. JAVA"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Nama <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.nama}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, nama: e.target.value }))
                }
                placeholder="Nama tag, mis. Java Developer"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Unit Pemilik</label>
            <SearchableSelect
              value={form.unitId}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, unitId: v }))
              }
              options={unitOptions.map((u) => ({
                value: u.id,
                label: u.namaUnit,
              }))}
              placeholder="Tidak ada (tag global)"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Deskripsi (opsional)
            </label>
            <textarea
              value={form.deskripsi}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, deskripsi: e.target.value }))
              }
              placeholder="Deskripsi bebas mengenai kompetensi/tag ini..."
              rows={2}
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:ring-3"
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
                ? "Simpan Tag"
                : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
