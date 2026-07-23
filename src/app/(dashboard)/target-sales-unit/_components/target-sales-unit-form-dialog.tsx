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
import type { TargetSalesUnit } from "@/lib/target-sales-unit";
import { toast } from "@/lib/toast-manager";
import type { Unit } from "@/lib/unit";
import { formatRupiah } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";

interface FormState {
  id: number | null;
  unitId: number | null;
  tahun: string;
  targetTw1: string;
  targetTw2: string;
  targetTw3: string;
  targetTw4: string;
}

function emptyForm(): FormState {
  return {
    id: null,
    unitId: null,
    tahun: String(new Date().getFullYear()),
    targetTw1: "",
    targetTw2: "",
    targetTw3: "",
    targetTw4: "",
  };
}

function formFromTarget(item: TargetSalesUnit): FormState {
  return {
    id: item.id,
    unitId: item.unitId,
    tahun: String(item.tahun),
    targetTw1: String(item.targetTw1),
    targetTw2: String(item.targetTw2),
    targetTw3: String(item.targetTw3),
    targetTw4: String(item.targetTw4),
  };
}

// Angka target opsional (default 0) — string kosong dianggap 0. Nilai negatif
// ditolak backend (400), jadi divalidasi juga di sini.
function parseTarget(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function TargetSalesUnitFormDialog({
  open,
  onOpenChange,
  editing,
  unitOptions,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: TargetSalesUnit | null;
  unitOptions: Unit[];
  onSaved: (saved: TargetSalesUnit) => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? formFromTarget(editing) : emptyForm());
  }, [open, editing]);

  const liveTotal =
    parseTarget(form.targetTw1) +
    parseTarget(form.targetTw2) +
    parseTarget(form.targetTw3) +
    parseTarget(form.targetTw4);

  function updateField(patch: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  async function handleSave() {
    if (!form.unitId) {
      toast.error("Unit wajib dipilih");
      return;
    }
    const tahunNum = Number(form.tahun);
    if (!tahunNum || tahunNum < 2000 || tahunNum > 2100) {
      toast.error("Tahun wajib diisi dengan angka yang valid");
      return;
    }
    const targets = [
      parseTarget(form.targetTw1),
      parseTarget(form.targetTw2),
      parseTarget(form.targetTw3),
      parseTarget(form.targetTw4),
    ];
    if (targets.some((t) => t < 0)) {
      toast.error("Target tidak boleh bernilai negatif");
      return;
    }

    setSaving(true);
    try {
      const isEdit = form.id !== null;
      const body = {
        unitId: form.unitId,
        tahun: tahunNum,
        targetTw1: targets[0],
        targetTw2: targets[1],
        targetTw3: targets[2],
        targetTw4: targets[3],
      };
      const res = await fetch(
        isEdit
          ? `/api/proxy/business/target-sales-unit/${form.id}`
          : "/api/proxy/business/target-sales-unit",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const resBody: ApiResponse<TargetSalesUnit> = await res.json();
      if (!res.ok || !resBody.success || !resBody.data) {
        toast.error(resBody.message || "Gagal menyimpan target sales unit");
        return;
      }
      onSaved(resBody.data);
      toast.success(
        isEdit
          ? "Target sales unit berhasil diperbarui"
          : "Target sales unit berhasil ditambahkan",
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
            {form.id === null
              ? "Tambah Target Sales Unit"
              : "Edit Target Sales Unit"}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Unit <span className="text-destructive">*</span>
              </label>
              <SearchableSelect
                value={form.unitId}
                onValueChange={(v) => updateField({ unitId: v })}
                options={unitOptions.map((u) => ({
                  value: u.id,
                  label: u.namaUnit,
                }))}
                placeholder="Pilih unit..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Tahun <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                min="2000"
                max="2100"
                value={form.tahun}
                onChange={(e) => updateField({ tahun: e.target.value })}
                placeholder="mis. 2026"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Target TW1</label>
              <Input
                type="number"
                min="0"
                value={form.targetTw1}
                onChange={(e) => updateField({ targetTw1: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Target TW2</label>
              <Input
                type="number"
                min="0"
                value={form.targetTw2}
                onChange={(e) => updateField({ targetTw2: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Target TW3</label>
              <Input
                type="number"
                min="0"
                value={form.targetTw3}
                onChange={(e) => updateField({ targetTw3: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Target TW4</label>
              <Input
                type="number"
                min="0"
                value={form.targetTw4}
                onChange={(e) => updateField({ targetTw4: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="bg-muted/50 flex items-center justify-between rounded-lg px-3 py-2">
            <span className="text-muted-foreground text-sm">
              Total Target (otomatis)
            </span>
            <span className="font-semibold tabular-nums">
              {formatRupiah(liveTotal)}
            </span>
          </div>
          <p className="text-muted-foreground text-xs">
            Total dihitung otomatis oleh backend dari jumlah keempat triwulan —
            preview di atas hanya bantuan tampilan. Pasangan unit + tahun harus
            unik.
          </p>
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
                ? "Simpan Target"
                : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
