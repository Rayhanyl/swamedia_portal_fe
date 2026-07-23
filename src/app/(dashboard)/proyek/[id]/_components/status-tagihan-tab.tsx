"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { toast } from "@/lib/toast-manager";
import { cn } from "@/lib/utils";
import type { Tagihan, TagihanStatusHistory } from "@/lib/tagihan";
import {
  TAGIHAN_STATUS_DOT_COLOR,
  TAGIHAN_STATUS_LABEL,
  TAGIHAN_STATUS_VALUES,
  type TagihanStatus,
} from "@/lib/tagihan-status";
import type { ApiResponse } from "@/types/api";

function formatTanggal(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

// Catatan: mockup desain menampilkan satu timeline gabungan tanpa pemilih
// tagihan, tapi riwayat status (`status-history`) sebenarnya per-tagihan —
// satu proyek bisa punya beberapa tagihan (lihat tab Tagihan/Invoice). Jadi
// pemilih "Tagihan" ditambahkan di sini supaya jelas riwayat/status yang
// diubah itu milik tagihan yang mana.
export function StatusTagihanTab({
  initialTagihanList,
}: {
  initialTagihanList: Tagihan[];
}) {
  const [tagihanList, setTagihanList] = useState(initialTagihanList);
  const [selectedId, setSelectedId] = useState<number | null>(
    initialTagihanList[initialTagihanList.length - 1]?.id ?? null,
  );
  const [history, setHistory] = useState<TagihanStatusHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusAktif, setStatusAktif] = useState<TagihanStatus>("RENCANA");
  const [keterangan, setKeterangan] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selected = tagihanList.find((t) => t.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedId) {
      setHistory([]);
      return;
    }
    setLoading(true);
    fetch(`/api/proxy/finance/tagihan/${selectedId}/status-history`, {
      cache: "no-store",
    })
      .then((res) => res.json() as Promise<ApiResponse<TagihanStatusHistory[]>>)
      .then((body) => setHistory(body.data ?? []))
      .catch(() => toast.error("Gagal memuat riwayat status tagihan"))
      .finally(() => setLoading(false));
  }, [selectedId]);

  useEffect(() => {
    if (selected) setStatusAktif(selected.statusAktif);
  }, [selected]);

  async function handleSubmit() {
    if (!selected) {
      toast.error("Pilih tagihan terlebih dahulu");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/proxy/finance/tagihan/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proyekId: selected.proyekId,
          tanggalTagihan: selected.tanggalTagihan,
          noTagihan: selected.noTagihan,
          keterangan: selected.keterangan,
          nilaiTagihan: selected.nilaiTagihan,
          nilaiDpp: selected.nilaiDpp,
          ppn: selected.ppn,
          pph: selected.pph,
          statusAktif,
          statusKomentar: keterangan.trim() || null,
        }),
      });
      const body: ApiResponse<Tagihan> = await res.json();
      if (!res.ok || !body.success || !body.data) {
        toast.error(body.message || "Gagal memperbarui status tagihan");
        return;
      }
      setTagihanList((prev) =>
        prev.map((t) => (t.id === selected.id ? (body.data as Tagihan) : t)),
      );
      const historyRes = await fetch(
        `/api/proxy/finance/tagihan/${selected.id}/status-history`,
        { cache: "no-store" },
      );
      const historyBody: ApiResponse<TagihanStatusHistory[]> =
        await historyRes.json();
      setHistory(historyBody.data ?? []);
      toast.success("Status tagihan berhasil diperbarui");
      setKeterangan("");
    } catch {
      toast.error("Tidak dapat menghubungi server");
    } finally {
      setSubmitting(false);
    }
  }

  const timeline = [...history].sort(
    (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime(),
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        {tagihanList.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Belum ada tagihan pada proyek ini.
          </p>
        ) : loading ? (
          <p className="text-muted-foreground text-sm">Memuat riwayat...</p>
        ) : timeline.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Belum ada riwayat status untuk tagihan ini.
          </p>
        ) : (
          timeline.map((entry) => (
            <div key={entry.id} className="relative border-l pl-4">
              <span
                className={cn(
                  "absolute top-1.5 -left-[3.5px] size-1.5 rounded-full",
                  TAGIHAN_STATUS_DOT_COLOR[entry.status],
                )}
              />
              <Badge className="mb-1">
                {TAGIHAN_STATUS_LABEL[entry.status]}
              </Badge>
              <span className="text-muted-foreground ml-2 text-xs">
                {formatTanggal(entry.tanggal)}
              </span>
              {entry.keterangan && (
                <p className="text-muted-foreground text-sm">
                  {entry.keterangan}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <p className="text-sm font-semibold">Data Tagihan Proyek</p>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Tagihan</label>
          <SearchableSelect
            value={selectedId}
            onValueChange={setSelectedId}
            options={tagihanList.map((t) => ({
              value: t.id,
              label: t.noTagihan,
            }))}
            placeholder="Pilih tagihan..."
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Status Tagihan</label>
          <SearchableSelect
            value={statusAktif}
            onValueChange={(v) => setStatusAktif(v ?? statusAktif)}
            options={TAGIHAN_STATUS_VALUES.map((s) => ({
              value: s,
              label: TAGIHAN_STATUS_LABEL[s],
            }))}
            disabled={!selected}
            placeholder="Pilih status..."
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Keterangan (opsional)</label>
          <textarea
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder="Dicatat ke riwayat status..."
            rows={2}
            disabled={!selected}
            className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:ring-3 disabled:opacity-50"
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={submitting || !selected}
          className="w-full"
        >
          {submitting ? "Menyimpan..." : "Tambah Status"}
        </Button>
      </div>
    </div>
  );
}
