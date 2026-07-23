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
import type { SysConfig } from "@/lib/konfigurasi-sistem";
import { toast } from "@/lib/toast-manager";
import type { ApiResponse } from "@/types/api";

// Hanya `value` yang editable. `value` boleh null (mis. last_sync_at) — jadi
// disediakan toggle "Kosongkan (null)" supaya bisa membedakan null eksplisit
// dari string kosong "", sesuai semantik API (null adalah nilai yang sah,
// berbeda dari menghilangkan field).
export function KonfigurasiEditDialog({
  item,
  onOpenChange,
  onSaved,
}: {
  item: SysConfig | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (saved: SysConfig) => void;
}) {
  const [value, setValue] = useState("");
  const [isNull, setIsNull] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!item) return;
    setIsNull(item.value === null);
    setValue(item.value ?? "");
  }, [item]);

  async function handleSave() {
    if (!item) return;
    setSaving(true);
    try {
      const payloadValue = isNull ? null : value;
      const res = await fetch(
        `/api/proxy/konfigurasi-sistem/${encodeURIComponent(item.key)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: payloadValue }),
        },
      );
      const body: ApiResponse<SysConfig> = await res.json();
      if (!res.ok || !body.success || !body.data) {
        toast.error(body.message || "Gagal menyimpan konfigurasi");
        return;
      }
      onSaved(body.data);
      toast.success("Konfigurasi sistem berhasil diperbarui");
      onOpenChange(false);
    } catch {
      toast.error("Tidak dapat menghubungi server");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={item !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-primary-foreground">
            Ubah Konfigurasi
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Key</label>
            <p className="bg-muted/50 rounded-lg px-3 py-2 font-mono text-xs">
              {item?.key}
            </p>
          </div>
          {item?.deskripsi && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Deskripsi</label>
              <p className="text-muted-foreground text-sm">{item.deskripsi}</p>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Value <span className="text-destructive">*</span>
            </label>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Nilai setting"
              disabled={isNull}
            />
            <label className="text-muted-foreground flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={isNull}
                onChange={(e) => setIsNull(e.target.checked)}
                className="size-3.5"
              />
              Kosongkan (simpan sebagai null)
            </label>
          </div>
          <p className="text-muted-foreground text-xs">
            Perubahan berdampak langsung pada perilaku sistem berikutnya (mis.
            prefiks penomoran). Nilai lama yang sudah ter-generate tidak ikut
            berubah.
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
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
