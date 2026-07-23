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
import type { KaryawanDropdownItem } from "@/lib/karyawan";
import type { ResourceUnit, ResourceUnitStatus } from "@/lib/resource-unit";
import type { Unit } from "@/lib/unit";
import type { ApiResponse } from "@/types/api";

interface FormState {
  id: number | null;
  unitId: number | null;
  unitNama: string;
  leadId: number | null;
  jumlah: string;
  kapasitasTerpakai: string;
  status: ResourceUnitStatus;
}

function emptyForm(): FormState {
  return {
    id: null,
    unitId: null,
    unitNama: "",
    leadId: null,
    jumlah: "0",
    kapasitasTerpakai: "0",
    status: "AKTIF",
  };
}

function formFromResourceUnit(item: ResourceUnit): FormState {
  return {
    id: item.id,
    unitId: item.unitId,
    unitNama: item.unitNama ?? "",
    leadId: item.leadId,
    jumlah: String(item.jumlah),
    kapasitasTerpakai: String(item.kapasitasTerpakai),
    status: item.status,
  };
}

export function ResourceUnitFormDialog({
  open,
  onOpenChange,
  editing,
  unitOptions,
  existingUnitIds,
  leadOptions,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: ResourceUnit | null;
  unitOptions: Unit[];
  existingUnitIds: number[];
  leadOptions: KaryawanDropdownItem[];
  onSaved: (saved: ResourceUnit) => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? formFromResourceUnit(editing) : emptyForm());
  }, [open, editing]);

  async function handleSave() {
    if (!form.unitId) {
      toast.error("Unit wajib dipilih");
      return;
    }
    const jumlahNum = Number(form.jumlah);
    const kapasitasNum = Number(form.kapasitasTerpakai);
    if (Number.isNaN(jumlahNum) || jumlahNum < 0) {
      toast.error("Jumlah headcount tidak valid");
      return;
    }
    if (Number.isNaN(kapasitasNum) || kapasitasNum < 0 || kapasitasNum > 100) {
      toast.error("Kapasitas terpakai harus di antara 0 dan 100");
      return;
    }

    setSaving(true);
    try {
      const isEdit = form.id !== null;
      const body = {
        unitId: form.unitId,
        leadId: form.leadId,
        jumlah: jumlahNum,
        kapasitasTerpakai: kapasitasNum,
        status: form.status,
      };
      const res = await fetch(
        isEdit
          ? `/api/proxy/master/resource-unit/${form.id}`
          : "/api/proxy/master/resource-unit",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const resBody: ApiResponse<ResourceUnit> = await res.json();
      if (!res.ok || !resBody.success || !resBody.data) {
        toast.error(resBody.message || "Gagal menyimpan resource unit");
        return;
      }
      onSaved(resBody.data);
      toast.success(
        isEdit
          ? "Resource unit berhasil diperbarui"
          : "Resource unit berhasil ditambahkan",
      );
      onOpenChange(false);
    } catch {
      toast.error("Tidak dapat menghubungi server");
    } finally {
      setSaving(false);
    }
  }

  // unitId unik per baris — saat Tambah, hanya tawarkan unit yang belum
  // punya baris resource. Saat Edit, unitId tidak diubah (ditampilkan
  // read-only) mengikuti pola field immutable di form Proyek.
  const availableUnitOptions = unitOptions.filter(
    (u) => !existingUnitIds.includes(u.id),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-primary-foreground">
            {form.id === null
              ? "Tambah Resource Unit"
              : `Edit Resource Unit — ${form.unitNama}`}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Unit <span className="text-destructive">*</span>
            </label>
            {form.id === null ? (
              <SearchableSelect
                value={form.unitId}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, unitId: v }))
                }
                options={availableUnitOptions.map((u) => ({
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
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Lead Unit</label>
            <SearchableSelect
              value={form.leadId}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, leadId: v }))
              }
              options={leadOptions.map((l) => ({
                value: l.id,
                label: l.nama,
              }))}
              placeholder="Belum ditentukan"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Jumlah Headcount <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                min="0"
                value={form.jumlah}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, jumlah: e.target.value }))
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Kapasitas Terpakai (%){" "}
                <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.kapasitasTerpakai}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    kapasitasTerpakai: e.target.value,
                  }))
                }
                placeholder="0"
              />
            </div>
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
                ? "Simpan Resource Unit"
                : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
