"use client";

import { useState } from "react";
import { ListIcon, MailIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { toast } from "@/lib/toast-manager";
import type { KaryawanDropdownItem } from "@/lib/karyawan";
import type { TeamMember, TeamMemberUndanganResult } from "@/lib/team-member";
import type { ApiResponse } from "@/types/api";

const UNDANGAN_STATUS_STYLE: Record<TeamMember["undanganStatus"], string> = {
  BELUM_DIKIRIM: "bg-muted text-muted-foreground",
  TERKIRIM: "bg-emerald-100 text-emerald-700",
  GAGAL: "bg-destructive/10 text-destructive",
};

const UNDANGAN_STATUS_LABEL: Record<TeamMember["undanganStatus"], string> = {
  BELUM_DIKIRIM: "Belum Dikirim",
  TERKIRIM: "Terkirim",
  GAGAL: "Gagal",
};

interface AddFormState {
  karyawanId: number | null;
  roleId: string;
  tglMulai: string;
  tglSelesai: string;
  bobot: string;
  keterangan: string;
}

const EMPTY_FORM: AddFormState = {
  karyawanId: null,
  roleId: "",
  tglMulai: "",
  tglSelesai: "",
  bobot: "",
  keterangan: "",
};

function formatBulan(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

// Catatan: `roleId` merujuk ke master `project_role_master` yang tidak
// terdokumentasi endpoint dropdown-nya (lihat lib/team-member.ts) — jadi
// diisi sebagai ID angka manual sampai endpoint itu tersedia, bukan dropdown
// nama peran seperti pada mockup.
export function TeamMembersTab({
  proyekId,
  kodeProyek,
  initialMembers,
  picOptions,
}: {
  proyekId: number;
  kodeProyek: string;
  initialMembers: TeamMember[];
  picOptions: KaryawanDropdownItem[];
}) {
  const [members, setMembers] = useState(initialMembers);
  const [form, setForm] = useState<AddFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [ratakan, setRatakan] = useState(false);
  const [sendingUndangan, setSendingUndangan] = useState(false);

  const totalBobot = members.reduce((sum, m) => sum + (m.bobot ?? 0), 0);
  const sisaBobot = Math.max(0, 100 - totalBobot);

  async function handleAdd() {
    const roleIdNum = Number(form.roleId);
    const bobotNum = form.bobot ? Number(form.bobot) : null;
    if (!form.karyawanId) {
      toast.error("Karyawan wajib dipilih");
      return;
    }
    if (!roleIdNum || roleIdNum <= 0) {
      toast.error("Role wajib diisi");
      return;
    }
    if (form.tglMulai && form.tglSelesai && form.tglSelesai < form.tglMulai) {
      toast.error("Periode selesai tidak boleh sebelum periode mulai");
      return;
    }
    if (bobotNum !== null && (bobotNum < 0 || bobotNum > 100)) {
      toast.error("Bobot harus di antara 0 dan 100");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        `/api/proxy/business/proyek/${proyekId}/team-member`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            karyawanId: form.karyawanId,
            roleId: roleIdNum,
            tglMulai: form.tglMulai || null,
            tglSelesai: form.tglSelesai || null,
            bobot: bobotNum,
            keterangan: form.keterangan.trim() || null,
          }),
        },
      );
      const body: ApiResponse<TeamMember> = await res.json();
      if (!res.ok || !body.success || !body.data) {
        toast.error(body.message || "Gagal menambah anggota tim");
        return;
      }
      setMembers((prev) => [...prev, body.data as TeamMember]);
      toast.success("Anggota tim berhasil ditambahkan");
      setForm(EMPTY_FORM);
    } catch {
      toast.error("Tidak dapat menghubungi server");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(member: TeamMember) {
    try {
      const res = await fetch(
        `/api/proxy/business/proyek/${proyekId}/team-member/${member.id}`,
        { method: "DELETE" },
      );
      const body: ApiResponse<null> = await res.json();
      if (!res.ok || !body.success) {
        toast.error(body.message || "Gagal menghapus anggota tim");
        return;
      }
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      toast.success("Anggota tim berhasil dihapus");
    } catch {
      toast.error("Tidak dapat menghubungi server");
    }
  }

  async function handleBagiRata() {
    if (members.length === 0) return;
    setRatakan(true);
    try {
      const even = Math.floor((100 / members.length) * 100) / 100;
      const results = await Promise.all(
        members.map((m, i) =>
          fetch(`/api/proxy/business/proyek/${proyekId}/team-member/${m.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              karyawanId: m.karyawanId,
              roleId: m.roleId,
              tglMulai: m.tglMulai,
              tglSelesai: m.tglSelesai,
              keterangan: m.keterangan,
              bobot:
                i === members.length - 1
                  ? Math.round((100 - even * (members.length - 1)) * 100) / 100
                  : even,
            }),
          }).then((res) => res.json() as Promise<ApiResponse<TeamMember>>),
        ),
      );
      if (results.some((r) => !r.success || !r.data)) {
        toast.error("Sebagian bobot gagal diperbarui");
      }
      setMembers((prev) =>
        prev.map((m, i) =>
          results[i].data ? (results[i].data as TeamMember) : m,
        ),
      );
      toast.success("Bobot berhasil dibagi rata");
    } catch {
      toast.error("Tidak dapat menghubungi server");
    } finally {
      setRatakan(false);
    }
  }

  async function handleSendUndangan() {
    setSendingUndangan(true);
    try {
      const res = await fetch(
        `/api/proxy/business/proyek/${proyekId}/team-member/undangan`,
        { method: "POST" },
      );
      const body: ApiResponse<TeamMemberUndanganResult> = await res.json();
      if (!res.ok || !body.success) {
        toast.error(body.message || "Gagal mengirim email undangan");
        return;
      }
      const result = body.data;
      if (result) {
        setMembers((prev) =>
          prev.map((m) => {
            const item = result.items.find((i) => i.id === m.id);
            return item ? { ...m, undanganStatus: item.status } : m;
          }),
        );
      }
      if (result && result.totalFailed > 0) {
        toast.error(body.message || "Sebagian undangan gagal dikirim");
      } else {
        toast.success(body.message || "Undangan email berhasil diproses");
      }
    } catch {
      toast.error("Tidak dapat menghubungi server");
    } finally {
      setSendingUndangan(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Daftar Anggota Tim</p>
          <p className="text-muted-foreground text-xs">Proyek {kodeProyek}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleBagiRata}
            disabled={ratakan || members.length === 0}
          >
            <ListIcon className="size-4" />
            Bagi Rata
          </Button>
          <Button
            onClick={handleSendUndangan}
            disabled={sendingUndangan || members.length === 0}
          >
            <MailIcon className="size-4" />
            {sendingUndangan ? "Mengirim..." : "Kirim Email Undangan Project"}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 border-b text-left">
              <th className="text-muted-foreground px-4 py-3 text-xs font-semibold">
                KARYAWAN
              </th>
              <th className="text-muted-foreground px-4 py-3 text-xs font-semibold">
                ROLE
              </th>
              <th className="text-muted-foreground px-4 py-3 text-xs font-semibold">
                PERIODE MULAI
              </th>
              <th className="text-muted-foreground px-4 py-3 text-xs font-semibold">
                PERIODE SELESAI
              </th>
              <th className="text-muted-foreground px-4 py-3 text-xs font-semibold">
                KETERANGAN
              </th>
              <th className="text-muted-foreground px-4 py-3 text-right text-xs font-semibold">
                BOBOT
              </th>
              <th className="text-muted-foreground px-4 py-3 text-xs font-semibold">
                UNDANGAN
              </th>
              <th className="text-muted-foreground px-4 py-3 text-right text-xs font-semibold">
                AKSI
              </th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="text-muted-foreground p-6 text-center text-sm"
                >
                  Belum ada anggota tim.
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-medium">
                    {m.karyawanNama ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-muted inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
                      {m.roleNama ?? `Role #${m.roleId}`}
                    </span>
                  </td>
                  <td className="text-muted-foreground px-4 py-3">
                    {formatBulan(m.tglMulai)}
                  </td>
                  <td className="text-muted-foreground px-4 py-3">
                    {formatBulan(m.tglSelesai)}
                  </td>
                  <td className="text-muted-foreground px-4 py-3">
                    {m.keterangan ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {m.bobot !== null ? `${m.bobot}%` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${UNDANGAN_STATUS_STYLE[m.undanganStatus]}`}
                    >
                      {UNDANGAN_STATUS_LABEL[m.undanganStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(m)}
                      title="Hapus"
                      className="border-input text-destructive hover:bg-destructive/10 ml-auto flex size-8 items-center justify-center rounded-md border"
                    >
                      <Trash2Icon className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {members.length > 0 && (
        <p className="text-sm">
          Total Bobot: <span className="font-semibold">{totalBobot}%</span>{" "}
          <span className="text-muted-foreground">·</span> Sisa Bobot:{" "}
          <span className="font-semibold text-emerald-600">{sisaBobot}%</span>
        </p>
      )}

      <div className="space-y-3 rounded-lg border p-4">
        <p className="text-sm font-semibold">Penambahan Team</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Periode Mulai <span className="text-destructive">*</span>
            </label>
            <Input
              type="date"
              value={form.tglMulai}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, tglMulai: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Periode Selesai</label>
            <Input
              type="date"
              value={form.tglSelesai}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, tglSelesai: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Karyawan <span className="text-destructive">*</span>
            </label>
            <SearchableSelect
              value={form.karyawanId}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, karyawanId: v }))
              }
              options={picOptions.map((p) => ({
                value: p.id,
                label: p.nama,
              }))}
              placeholder="Pilih karyawan..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Role (ID) <span className="text-destructive">*</span>
            </label>
            <Input
              type="number"
              min="1"
              value={form.roleId}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, roleId: e.target.value }))
              }
              placeholder="ID role proyek"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Bobot (%)</label>
            <Input
              type="number"
              min="0"
              max="100"
              value={form.bobot}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, bobot: e.target.value }))
              }
              placeholder="0 - 100"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Keterangan</label>
            <Input
              value={form.keterangan}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, keterangan: e.target.value }))
              }
              placeholder="Keterangan penugasan..."
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleAdd} disabled={saving}>
            {saving ? "Menyimpan..." : "+ Tambah"}
          </Button>
        </div>
      </div>
    </div>
  );
}
