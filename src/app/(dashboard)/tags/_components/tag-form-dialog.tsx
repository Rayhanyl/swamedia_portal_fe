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
import type { Tag } from "@/lib/tags";
import type { Unit } from "@/lib/unit";
import type { ApiResponse } from "@/types/api";

interface FormState {
  id: number | null;
  kode: string;
  nama: string;
  unitId: number | null;
}

function emptyForm(): FormState {
  return { id: null, kode: "", nama: "", unitId: null };
}

function formFromTag(item: Tag): FormState {
  return { id: item.id, kode: item.kode, nama: item.nama, unitId: item.unitId };
}

export function TagFormDialog({
  open,
  onOpenChange,
  editing,
  unitOptions,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Tag | null;
  unitOptions: Unit[];
  onSaved: (saved: Tag) => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? formFromTag(editing) : emptyForm());
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
      };
      const res = await fetch(
        isEdit ? `/api/proxy/master/tags/${form.id}` : "/api/proxy/master/tags",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const resBody: ApiResponse<Tag> = await res.json();
      if (!res.ok || !resBody.success || !resBody.data) {
        toast.error(resBody.message || "Gagal menyimpan tag");
        return;
      }
      onSaved(resBody.data);
      toast.success(
        isEdit ? "Tag berhasil diperbarui" : "Tag berhasil ditambahkan",
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary-foreground">
            {form.id === null ? "Tambah Tag Baru" : "Edit Tag"}
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
              placeholder="Kode tag, mis. PRIORITAS"
            />
            <p className="text-muted-foreground text-xs">
              Unik per unit — dua unit berbeda boleh memakai kode yang sama.
            </p>
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
              placeholder="Nama tag, mis. Proyek Prioritas"
            />
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
