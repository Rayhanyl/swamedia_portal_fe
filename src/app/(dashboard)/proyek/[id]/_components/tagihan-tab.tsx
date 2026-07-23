"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { toast } from "@/lib/toast-manager";
import type { Pencairan } from "@/lib/pencairan";
import type { Tagihan } from "@/lib/tagihan";
import {
  TAGIHAN_STATUS_LABEL,
  TAGIHAN_STATUS_VALUES,
  type TagihanStatus,
} from "@/lib/tagihan-status";
import type { ApiResponse } from "@/types/api";

interface FormState {
  tanggalTagihan: string;
  noTagihan: string;
  keterangan: string;
  statusAktif: TagihanStatus;
  nilaiTagihan: string;
  nilaiDpp: string;
  ppn: string;
  pph: string;
  nilaiCair: string;
  tanggalCair: string;
}

const EMPTY_FORM: FormState = {
  tanggalTagihan: "",
  noTagihan: "",
  keterangan: "",
  statusAktif: "RENCANA",
  nilaiTagihan: "",
  nilaiDpp: "",
  ppn: "",
  pph: "",
  nilaiCair: "",
  tanggalCair: "",
};

function formatRupiah(value: number) {
  return `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;
}

function formatTanggal(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

const STATUS_BADGE_VARIANT: Record<
  TagihanStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  PELUANG: "outline",
  RENCANA: "secondary",
  BAST: "default",
  KIRIM_TAGIHAN: "default",
  LUNAS: "default",
  TIDAK_TERTAGIH: "destructive",
};

// Catatan: modul Tagihan (documentation/note/api/06-finansial.md) TIDAK
// punya kolom "nilai cair"/"tgl cair" langsung — nilai itu diturunkan dari
// sub-resource Pencairan. Form "Tambah Tagihan" di sini mockup-nya
// menggabungkan keduanya jadi satu; di belakang layar itu dipecah jadi dua
// panggilan API berurutan: POST tagihan, lalu (kalau Nilai Cair diisi) POST
// pencairan FINAL untuk tagihan yang baru dibuat.
export function TagihanTab({
  proyekId,
  initialTagihanList,
  initialPencairanByTagihan,
}: {
  proyekId: number;
  initialTagihanList: Tagihan[];
  initialPencairanByTagihan: Record<number, Pencairan[]>;
}) {
  const [tagihanList, setTagihanList] = useState(initialTagihanList);
  const [pencairanByTagihan, setPencairanByTagihan] = useState(
    initialPencairanByTagihan,
  );
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function cairInfo(tagihanId: number) {
    const rows = (pencairanByTagihan[tagihanId] ?? []).filter(
      (p) => p.status !== "DIBATALKAN",
    );
    const nilai = rows.reduce((sum, p) => sum + p.nilai, 0);
    const latest = rows.sort((a, b) =>
      b.tanggalPencairan.localeCompare(a.tanggalPencairan),
    )[0];
    return { nilai, tanggal: latest?.tanggalPencairan ?? null };
  }

  async function handleAdd() {
    const nilaiTagihanNum = Number(form.nilaiTagihan);
    if (!form.tanggalTagihan) {
      toast.error("Tanggal tagihan wajib diisi");
      return;
    }
    if (!form.noTagihan.trim()) {
      toast.error("No. Tagihan wajib diisi");
      return;
    }
    if (!nilaiTagihanNum || nilaiTagihanNum <= 0) {
      toast.error("Nilai tagihan wajib diisi dan lebih besar dari 0");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/proxy/finance/tagihan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proyekId,
          tanggalTagihan: form.tanggalTagihan,
          noTagihan: form.noTagihan.trim(),
          keterangan: form.keterangan.trim() || null,
          statusAktif: form.statusAktif,
          nilaiTagihan: nilaiTagihanNum,
          nilaiDpp: form.nilaiDpp ? Number(form.nilaiDpp) : null,
          ppn: form.ppn ? Number(form.ppn) : null,
          pph: form.pph ? Number(form.pph) : null,
        }),
      });
      const body: ApiResponse<Tagihan> = await res.json();
      if (!res.ok || !body.success || !body.data) {
        toast.error(body.message || "Gagal menambah tagihan");
        return;
      }
      const saved = body.data;
      let pencairanRows: Pencairan[] = [];

      const nilaiCairNum = Number(form.nilaiCair);
      if (nilaiCairNum > 0) {
        const cairRes = await fetch(
          `/api/proxy/finance/tagihan/${saved.id}/pencairan`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tanggalPencairan: form.tanggalCair || form.tanggalTagihan,
              nilai: nilaiCairNum,
              status: "FINAL",
              keterangan: null,
            }),
          },
        );
        const cairBody: ApiResponse<Pencairan> = await cairRes.json();
        if (cairRes.ok && cairBody.success && cairBody.data) {
          pencairanRows = [cairBody.data];
        } else {
          toast.error(
            cairBody.message ||
              "Tagihan tersimpan, tapi pencatatan nilai cair gagal",
          );
        }
      }

      setTagihanList((prev) => [...prev, saved]);
      setPencairanByTagihan((prev) => ({ ...prev, [saved.id]: pencairanRows }));
      toast.success("Tagihan berhasil ditambahkan");
      setForm(EMPTY_FORM);
    } catch {
      toast.error("Tidak dapat menghubungi server");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary text-primary-foreground text-left">
              <th className="px-4 py-3 text-xs font-semibold">NO. TAGIHAN</th>
              <th className="px-4 py-3 text-xs font-semibold">TANGGAL</th>
              <th className="px-4 py-3 text-xs font-semibold">KETERANGAN</th>
              <th className="px-4 py-3 text-xs font-semibold">STATUS</th>
              <th className="px-4 py-3 text-right text-xs font-semibold">
                NILAI TAGIHAN
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold">
                NILAI DPP
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold">
                PPN
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold">
                PPH
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold">
                NILAI CAIR
              </th>
              <th className="px-4 py-3 text-xs font-semibold">TGL CAIR</th>
            </tr>
          </thead>
          <tbody>
            {tagihanList.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="text-muted-foreground p-6 text-center text-sm"
                >
                  Belum ada tagihan.
                </td>
              </tr>
            ) : (
              tagihanList.map((t) => {
                const cair = cairInfo(t.id);
                return (
                  <tr key={t.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {t.noTagihan}
                    </td>
                    <td className="text-muted-foreground px-4 py-3 whitespace-nowrap">
                      {formatTanggal(t.tanggalTagihan)}
                    </td>
                    <td className="text-muted-foreground px-4 py-3">
                      {t.keterangan ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_BADGE_VARIANT[t.statusAktif]}>
                        {TAGIHAN_STATUS_LABEL[t.statusAktif]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                      {formatRupiah(t.nilaiTagihan)}
                    </td>
                    <td className="text-muted-foreground px-4 py-3 text-right whitespace-nowrap">
                      {t.nilaiDpp !== null ? formatRupiah(t.nilaiDpp) : "—"}
                    </td>
                    <td className="text-muted-foreground px-4 py-3 text-right whitespace-nowrap">
                      {t.ppn !== null ? formatRupiah(t.ppn) : "—"}
                    </td>
                    <td className="text-muted-foreground px-4 py-3 text-right whitespace-nowrap">
                      {t.pph !== null ? formatRupiah(t.pph) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                      {formatRupiah(cair.nilai)}
                    </td>
                    <td className="text-muted-foreground px-4 py-3 whitespace-nowrap">
                      {formatTanggal(cair.tanggal)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <p className="text-sm font-semibold">Data Tagihan</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tanggal Tagihan</label>
            <Input
              type="date"
              value={form.tanggalTagihan}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  tanggalTagihan: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">No Tagihan</label>
            <Input
              value={form.noTagihan}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, noTagihan: e.target.value }))
              }
              placeholder="Masukkan nomor invoice..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Keterangan</label>
            <Input
              value={form.keterangan}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, keterangan: e.target.value }))
              }
              placeholder="Keterangan penagihan / termin..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Status Tagihan</label>
            <SearchableSelect
              value={form.statusAktif}
              onValueChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  statusAktif: v ?? prev.statusAktif,
                }))
              }
              options={TAGIHAN_STATUS_VALUES.map((s) => ({
                value: s,
                label: TAGIHAN_STATUS_LABEL[s],
              }))}
              placeholder="Pilih status..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nilai Tagihan (Rp)</label>
            <Input
              type="number"
              min="0"
              value={form.nilaiTagihan}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, nilaiTagihan: e.target.value }))
              }
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nilai DPP (Rp)</label>
            <Input
              type="number"
              min="0"
              value={form.nilaiDpp}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, nilaiDpp: e.target.value }))
              }
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">PPN (Rp)</label>
            <Input
              type="number"
              min="0"
              value={form.ppn}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, ppn: e.target.value }))
              }
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">PPH (Rp)</label>
            <Input
              type="number"
              min="0"
              value={form.pph}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, pph: e.target.value }))
              }
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Nilai Cair / Transfer (Rp)
            </label>
            <Input
              type="number"
              min="0"
              value={form.nilaiCair}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, nilaiCair: e.target.value }))
              }
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Tanggal Cair / Transfer
            </label>
            <Input
              type="date"
              value={form.tanggalCair}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, tanggalCair: e.target.value }))
              }
            />
          </div>
        </div>
        <Button onClick={handleAdd} disabled={saving}>
          {saving ? "Menyimpan..." : "Tambah Tagihan"}
        </Button>
      </div>
    </div>
  );
}
