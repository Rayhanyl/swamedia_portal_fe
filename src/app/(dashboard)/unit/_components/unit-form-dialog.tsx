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
import type { Unit, UnitStatus } from "@/lib/unit";
import type { ApiResponse } from "@/types/api";

interface FormState {
  id: number | null;
  namaUnit: string;
  kodeUnit: string;
  kodeNik: string;
  parentUnitId: number | null;
  status: UnitStatus;
}

function emptyForm(): FormState {
  return {
    id: null,
    namaUnit: "",
    kodeUnit: "",
    kodeNik: "",
    parentUnitId: null,
    status: "AKTIF",
  };
}

function formFromUnit(item: Unit): FormState {
  return {
    id: item.id,
    namaUnit: item.namaUnit,
    kodeUnit: item.kodeUnit,
    kodeNik: item.kodeNik,
    parentUnitId: item.parentUnitId,
    status: item.status,
  };
}

export function UnitFormDialog({
  open,
  onOpenChange,
  editing,
  allUnits,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Unit | null;
  allUnits: Unit[];
  onSaved: (saved: Unit) => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? formFromUnit(editing) : emptyForm());
  }, [open, editing]);

  async function handleSave() {
    if (!form.namaUnit.trim() || !form.kodeUnit.trim() || !form.kodeNik.trim()) {
      toast.error("Nama unit, kode unit, dan kode NIK wajib diisi");
      return;
    }
    if (form.kodeNik.trim().length !== 2) {
      toast.error("Kode NIK harus tepat 2 huruf");
      return;
    }

    setSaving(true);
    try {
      const isEdit = form.id !== null;
      const body = {
        namaUnit: form.namaUnit.trim(),
        kodeUnit: form.kodeUnit.trim(),
        kodeNik: form.kodeNik.trim().toUpperCase(),
        parentUnitId: form.parentUnitId,
        status: form.status,
      };
      const res = await fetch(
        isEdit ? `/api/proxy/master/units/${form.id}` : "/api/proxy/master/units",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const resBody: ApiResponse<Unit> = await res.json();
      if (!res.ok || !resBody.success || !resBody.data) {
        toast.error(resBody.message || "Gagal menyimpan unit");
        return;
      }
      onSaved(resBody.data);
      toast.success(
        isEdit ? "Unit berhasil diperbarui" : "Unit berhasil ditambahkan",
      );
      onOpenChange(false);
    } catch {
      toast.error("Tidak dapat menghubungi server");
    } finally {
      setSaving(false);
    }
  }

  const parentOptions = allUnits.filter((u) => u.id !== form.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-primary-foreground">
            {form.id === null ? "Tambah Unit Baru" : "Edit Unit"}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Kode Unit <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.kodeUnit}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, kodeUnit: e.target.value }))
                }
                placeholder="Kode unik, mis. DB"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Nama Unit <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.namaUnit}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, namaUnit: e.target.value }))
                }
                placeholder="Nama unit organisasi"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Kode NIK <span className="text-destructive">*</span>
            </label>
            <Input
              value={form.kodeNik}
              maxLength={2}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  kodeNik: e.target.value.toUpperCase(),
                }))
              }
              placeholder="2 huruf, mis. BL"
            />
            <p className="text-muted-foreground text-xs">
              Kode legacy 2 huruf yang tertanam di NIK karyawan unit ini (mis.
              &quot;BL&quot; untuk Billing System Solutions) — beda dari Kode
              Unit di atas, dipakai khusus untuk menyusun NIK karyawan baru.
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Unit Induk</label>
            <SearchableSelect
              value={form.parentUnitId}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, parentUnitId: v }))
              }
              options={parentOptions.map((u) => ({
                value: u.id,
                label: u.namaUnit,
              }))}
              placeholder="Tidak ada (unit puncak)"
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
                ? "Simpan Unit"
                : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
