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
import { toast } from "@/lib/toast-manager";
import type { Pembayaran } from "@/lib/pembayaran";
import type { ApiResponse } from "@/types/api";

export function PembayaranApprovalDialog({
  mode,
  item,
  onOpenChange,
  onDone,
}: {
  mode: "approve" | "reject" | null;
  item: Pembayaran | null;
  onOpenChange: (open: boolean) => void;
  onDone: (updated: Pembayaran) => void;
}) {
  const [tanggalRealisasi, setTanggalRealisasi] = useState("");
  const [catatan, setCatatan] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!mode) return;
    setTanggalRealisasi("");
    setCatatan("");
  }, [mode, item]);

  async function handleSubmit() {
    if (!item || !mode) return;
    setSubmitting(true);
    try {
      const body =
        mode === "approve"
          ? {
              tanggalRealisasi: tanggalRealisasi || null,
              catatan: catatan.trim() || null,
            }
          : { catatan: catatan.trim() || null };
      const res = await fetch(
        `/api/proxy/finance/pembayaran/${item.id}/${mode}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const resBody: ApiResponse<Pembayaran> = await res.json();
      if (!res.ok || !resBody.success || !resBody.data) {
        toast.error(
          resBody.message ||
            (mode === "approve"
              ? "Gagal menyetujui pembayaran"
              : "Gagal menolak pembayaran"),
        );
        return;
      }
      onDone(resBody.data);
      toast.success(
        mode === "approve"
          ? "Pembayaran berhasil disetujui"
          : "Pembayaran berhasil ditolak",
      );
      onOpenChange(false);
    } catch {
      toast.error("Tidak dapat menghubungi server");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={mode !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-primary-foreground">
            {mode === "approve" ? "Setujui Pembayaran" : "Tolak Pembayaran"}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm">
            {mode === "approve" ? "Menyetujui" : "Menolak"} pembayaran{" "}
            <span className="font-semibold">
              {item?.proyekKode ?? item?.proyekNama}
            </span>{" "}
            senilai{" "}
            <span className="font-semibold">
              {item && new Intl.NumberFormat("id-ID").format(item.nilai)}
            </span>
            .
          </p>
          {mode === "approve" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Tanggal Realisasi (opsional)
              </label>
              <Input
                type="date"
                value={tanggalRealisasi}
                onChange={(e) => setTanggalRealisasi(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Catatan {mode === "reject" ? "Penolakan" : "Persetujuan"}{" "}
              (opsional)
            </label>
            <Input
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder={
                mode === "approve"
                  ? "Catatan persetujuan..."
                  : "Alasan penolakan..."
              }
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Batal
          </Button>
          <Button
            variant={mode === "reject" ? "destructive" : "default"}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? "Memproses..."
              : mode === "approve"
                ? "Setujui"
                : "Tolak"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
