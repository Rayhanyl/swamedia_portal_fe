"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { toast } from "@/lib/toast-manager";
import type { Unit } from "@/lib/unit";
import type { UnitShare } from "@/lib/unit-share";
import type { ApiResponse } from "@/types/api";

function formatRupiah(value: number) {
  return `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;
}

export function UnitShareTab({
  proyekId,
  nilaiProyek,
  initialShares,
  unitOptions,
}: {
  proyekId: number;
  nilaiProyek: number;
  initialShares: UnitShare[];
  unitOptions: Unit[];
}) {
  const [shares, setShares] = useState(initialShares);
  const [unitId, setUnitId] = useState<number | null>(null);
  const [nilaiShare, setNilaiShare] = useState("");
  const [saving, setSaving] = useState(false);

  const totalShare = shares.reduce((sum, s) => sum + s.nilaiShare, 0);
  const sisa = nilaiProyek - totalShare;

  async function handleAdd() {
    const nilaiShareNum = Number(nilaiShare);
    if (!unitId) {
      toast.error("Unit wajib dipilih");
      return;
    }
    if (!nilaiShareNum || nilaiShareNum <= 0) {
      toast.error("Nilai share wajib diisi dan lebih besar dari 0");
      return;
    }
    if (shares.some((s) => s.unitId === unitId)) {
      toast.error("Unit ini sudah punya share pada proyek ini");
      return;
    }
    if (totalShare + nilaiShareNum > nilaiProyek) {
      toast.error("Total share tidak boleh melebihi nilai proyek");
      return;
    }

    setSaving(true);
    try {
      const persentase =
        nilaiProyek > 0
          ? Math.round((nilaiShareNum / nilaiProyek) * 10000) / 100
          : null;
      const res = await fetch(
        `/api/proxy/business/proyek/${proyekId}/unit-share`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unitId,
            nilaiShare: nilaiShareNum,
            persentase,
          }),
        },
      );
      const body: ApiResponse<UnitShare> = await res.json();
      if (!res.ok || !body.success || !body.data) {
        toast.error(body.message || "Gagal menambah unit share");
        return;
      }
      setShares((prev) => [...prev, body.data as UnitShare]);
      toast.success("Unit share berhasil ditambahkan");
      setUnitId(null);
      setNilaiShare("");
    } catch {
      toast.error("Tidak dapat menghubungi server");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 border-b text-left">
              <th className="text-muted-foreground px-4 py-3 text-xs font-semibold">
                UNIT
              </th>
              <th className="text-muted-foreground px-4 py-3 text-right text-xs font-semibold">
                PERSENTASE
              </th>
              <th className="text-muted-foreground px-4 py-3 text-right text-xs font-semibold">
                NILAI SHARE
              </th>
            </tr>
          </thead>
          <tbody>
            {shares.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="text-muted-foreground p-6 text-center text-sm"
                >
                  Belum ada pembagian unit share.
                </td>
              </tr>
            ) : (
              shares.map((s) => (
                <tr key={s.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3">{s.unitNama ?? "—"}</td>
                  <td className="text-muted-foreground px-4 py-3 text-right">
                    {s.persentase !== null ? `${s.persentase}%` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatRupiah(s.nilaiShare)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {shares.length > 0 && (
            <tfoot>
              <tr className="bg-muted/40 border-t font-semibold">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3 text-right">
                  {nilaiProyek > 0
                    ? `${Math.round((totalShare / nilaiProyek) * 10000) / 100}%`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  {formatRupiah(totalShare)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <p className="text-sm font-semibold">Penambahan Share Unit</p>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Unit</label>
          <SearchableSelect
            value={unitId}
            onValueChange={setUnitId}
            options={unitOptions.map((u) => ({
              value: u.id,
              label: u.namaUnit,
            }))}
            placeholder="Pilih unit..."
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Share Nilai (Rp)</label>
          <Input
            type="number"
            min="0"
            value={nilaiShare}
            onChange={(e) => setNilaiShare(e.target.value)}
            placeholder="Masukkan porsi share nilai proyek"
          />
        </div>
        <p className="text-muted-foreground text-xs">
          Sisa nilai proyek yang belum dibagi: {formatRupiah(Math.max(sisa, 0))}
        </p>
        <Button onClick={handleAdd} disabled={saving} className="w-full">
          {saving ? "Menyimpan..." : "Tambah Unit"}
        </Button>
      </div>
    </div>
  );
}
