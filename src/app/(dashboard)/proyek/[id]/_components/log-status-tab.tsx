"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { toast } from "@/lib/toast-manager";
import { cn } from "@/lib/utils";
import type { Proyek, ProyekDetail } from "@/lib/proyek";
import type { ProyekLogStatus } from "@/lib/proyek-log-status";
import {
  PROYEK_STATUS_DOT_COLOR,
  PROYEK_STATUS_LABEL,
  PROYEK_STATUS_VALUES,
  type ProyekStatus,
} from "@/lib/proyek-status";
import type { ApiResponse } from "@/types/api";

function formatTanggal(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

// Catatan: mockup desain punya field "Tanggal" di panel Update Status, tapi
// tanggal log-status di-generate backend (bukan dikirim client) — lihat
// documentation/note/api/05-sales-unit.md#get-apiv1businessproyekidlog-status.
// Field itu sengaja tidak dibuat di sini supaya tidak menyesatkan (isinya
// tidak akan pernah benar-benar dipakai backend).
export function LogStatusTab({
  proyek,
  logStatus,
  onUpdated,
}: {
  proyek: ProyekDetail;
  logStatus: ProyekLogStatus[];
  onUpdated: (updatedProyek: Proyek, entries: ProyekLogStatus[]) => void;
}) {
  const [komentar, setKomentar] = useState("");
  const [status, setStatus] = useState<ProyekStatus>(proyek.status);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      // PUT proyek pakai semantik full-replace — field lain yang tidak
      // diubah di panel ini tetap dikirim ulang dengan nilai proyek saat ini.
      const res = await fetch(`/api/proxy/business/proyek/${proyek.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: proyek.customerId,
          industriId: proyek.industriId,
          namaProyek: proyek.namaProyek,
          nilaiProyek: proyek.nilaiProyek,
          subkon: proyek.subkon,
          picSalesId: proyek.picSalesId,
          tanggalMulai: proyek.tanggalMulai,
          kontrakBiasaId: proyek.kontrakBiasaId,
          keteranganPembayaran: proyek.keteranganPembayaran,
          status,
          statusKomentar: komentar.trim() || null,
        }),
      });
      const body: ApiResponse<Proyek> = await res.json();
      if (!res.ok || !body.success || !body.data) {
        toast.error(body.message || "Gagal memperbarui status proyek");
        return;
      }

      const historyRes = await fetch(
        `/api/proxy/business/proyek/${proyek.id}/log-status`,
        { cache: "no-store" },
      );
      const historyBody: ApiResponse<ProyekLogStatus[]> =
        await historyRes.json();

      onUpdated(body.data, historyBody.data ?? []);
      toast.success("Log status berhasil ditambahkan");
      setKomentar("");
    } catch {
      toast.error("Tidak dapat menghubungi server");
    } finally {
      setSubmitting(false);
    }
  }

  const timeline = [...logStatus].sort(
    (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime(),
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        {timeline.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Belum ada riwayat status.
          </p>
        ) : (
          timeline.map((entry) => (
            <div key={entry.id} className="relative border-l pl-4">
              <span
                className={cn(
                  "absolute top-1.5 -left-[3.5px] size-1.5 rounded-full",
                  PROYEK_STATUS_DOT_COLOR[entry.status],
                )}
              />
              <p className="text-sm font-semibold">
                {PROYEK_STATUS_LABEL[entry.status]}{" "}
                <span className="text-muted-foreground text-xs font-normal">
                  {formatTanggal(entry.tanggal)}
                </span>
              </p>
              {entry.komentar && (
                <p className="text-muted-foreground text-sm">
                  {entry.komentar}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <p className="text-sm font-semibold">Update Status</p>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Update Log / Komentar</label>
          <textarea
            value={komentar}
            onChange={(e) => setKomentar(e.target.value)}
            placeholder="Tulis catatan perkembangan proyek..."
            rows={3}
            className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:ring-3"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Status Proyek</label>
          <SearchableSelect
            value={status}
            onValueChange={(v) => setStatus(v ?? status)}
            options={PROYEK_STATUS_VALUES.map((s) => ({
              value: s,
              label: PROYEK_STATUS_LABEL[s],
            }))}
            placeholder="Pilih status..."
          />
        </div>
        <Button onClick={handleSubmit} disabled={submitting} className="w-full">
          {submitting ? "Menyimpan..." : "Submit Log"}
        </Button>
      </div>
    </div>
  );
}
