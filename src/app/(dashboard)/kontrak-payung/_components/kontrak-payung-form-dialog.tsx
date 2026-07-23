"use client";

import { useEffect, useState } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";

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
import type { Customer } from "@/lib/customer";
import type {
  KontrakPayung,
  KontrakPayungDetail,
  TipeHargaRole,
} from "@/lib/kontrak-payung";
import type { ApiResponse } from "@/types/api";

interface HargaRoleRow {
  key: string;
  roleId: string;
  tipeHarga: TipeHargaRole;
  nilai: string;
  keterangan: string;
}

interface FormState {
  id: number | null;
  customerId: number | null;
  noKontrakPayung: string;
  namaKontrak: string;
  tanggalKontrak: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  hargaRole: HargaRoleRow[];
}

function emptyForm(): FormState {
  return {
    id: null,
    customerId: null,
    noKontrakPayung: "",
    namaKontrak: "",
    tanggalKontrak: "",
    tanggalMulai: "",
    tanggalSelesai: "",
    hargaRole: [],
  };
}

function emptyHargaRoleRow(): HargaRoleRow {
  return {
    key: crypto.randomUUID(),
    roleId: "",
    tipeHarga: "PER_BULAN",
    nilai: "",
    keterangan: "",
  };
}

function formFromKontrakPayung(item: KontrakPayung): FormState {
  return {
    id: item.id,
    customerId: item.customerId,
    noKontrakPayung: item.noKontrakPayung,
    namaKontrak: item.namaKontrak,
    tanggalKontrak: item.tanggalKontrak,
    tanggalMulai: item.tanggalMulai,
    tanggalSelesai: item.tanggalSelesai,
    hargaRole: [],
  };
}

// Catatan: `roleId` merujuk ke master `project_role_master` yang tidak
// terdokumentasi endpoint dropdown-nya (lihat lib/kontrak-payung.ts dan
// lib/team-member.ts untuk pola yang sama) — jadi diisi sebagai ID angka
// manual sampai endpoint itu tersedia, bukan dropdown nama peran.
export function KontrakPayungFormDialog({
  open,
  onOpenChange,
  editing,
  customerOptions,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: KontrakPayung | null;
  customerOptions: Customer[];
  onSaved: (saved: KontrakPayung) => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!editing) {
      setForm(emptyForm());
      return;
    }
    setForm(formFromKontrakPayung(editing));

    // hargaRole TIDAK ada di list — ambil dari GET detail supaya form
    // menampilkan daftar harga yang sudah ada. PUT mengirim hargaRole hanya
    // bila field ini eksplisit ada di body (replace-or-leave, beda dari
    // field lain yang full-replace) — dengan data akurat di sini, kita
    // selalu kirim eksplisit saat edit supaya aman menambah/menghapus baris.
    let cancelled = false;
    setLoadingDetail(true);
    fetch(`/api/proxy/business/kontrak-payung/${editing.id}`, {
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((body: ApiResponse<KontrakPayungDetail>) => {
        if (cancelled || !body.success || !body.data) return;
        setForm((prev) => ({
          ...prev,
          hargaRole: body.data!.hargaRole.map((h) => ({
            key: crypto.randomUUID(),
            roleId: String(h.roleId),
            tipeHarga: h.tipeHarga,
            nilai: String(h.nilai),
            keterangan: h.keterangan ?? "",
          })),
        }));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, editing]);

  function addHargaRoleRow() {
    setForm((prev) => ({
      ...prev,
      hargaRole: [...prev.hargaRole, emptyHargaRoleRow()],
    }));
  }

  function removeHargaRoleRow(key: string) {
    setForm((prev) => ({
      ...prev,
      hargaRole: prev.hargaRole.filter((r) => r.key !== key),
    }));
  }

  function updateHargaRoleRow(key: string, patch: Partial<HargaRoleRow>) {
    setForm((prev) => ({
      ...prev,
      hargaRole: prev.hargaRole.map((r) =>
        r.key === key ? { ...r, ...patch } : r,
      ),
    }));
  }

  async function handleSave() {
    if (!form.customerId) {
      toast.error("Customer wajib dipilih");
      return;
    }
    if (!form.noKontrakPayung.trim() || !form.namaKontrak.trim()) {
      toast.error("Nomor dan nama kontrak wajib diisi");
      return;
    }
    if (!form.tanggalKontrak || !form.tanggalMulai || !form.tanggalSelesai) {
      toast.error("Tanggal kontrak, mulai, dan selesai wajib diisi");
      return;
    }
    if (form.tanggalSelesai < form.tanggalMulai) {
      toast.error("Tanggal selesai tidak boleh lebih awal dari tanggal mulai");
      return;
    }

    const hargaRolePayload: {
      roleId: number;
      tipeHarga: TipeHargaRole;
      nilai: number;
      keterangan: string | null;
    }[] = [];
    for (const row of form.hargaRole) {
      const roleIdNum = Number(row.roleId);
      const nilaiNum = Number(row.nilai);
      if (!roleIdNum || roleIdNum <= 0) {
        toast.error("Role (ID) pada daftar harga wajib diisi");
        return;
      }
      if (!nilaiNum || nilaiNum <= 0) {
        toast.error("Nilai harga per role wajib diisi dan lebih besar dari 0");
        return;
      }
      hargaRolePayload.push({
        roleId: roleIdNum,
        tipeHarga: row.tipeHarga,
        nilai: nilaiNum,
        keterangan: row.keterangan.trim() || null,
      });
    }

    setSaving(true);
    try {
      const isEdit = form.id !== null;
      const body = {
        customerId: form.customerId,
        noKontrakPayung: form.noKontrakPayung.trim(),
        namaKontrak: form.namaKontrak.trim(),
        tanggalKontrak: form.tanggalKontrak,
        tanggalMulai: form.tanggalMulai,
        tanggalSelesai: form.tanggalSelesai,
        hargaRole: hargaRolePayload,
      };
      const res = await fetch(
        isEdit
          ? `/api/proxy/business/kontrak-payung/${form.id}`
          : "/api/proxy/business/kontrak-payung",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const resBody: ApiResponse<KontrakPayung> = await res.json();
      if (!res.ok || !resBody.success || !resBody.data) {
        toast.error(resBody.message || "Gagal menyimpan kontrak payung");
        return;
      }
      onSaved(resBody.data);
      toast.success(
        isEdit
          ? "Kontrak payung berhasil diperbarui"
          : "Kontrak payung berhasil ditambahkan",
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-primary-foreground">
            {form.id === null
              ? "Tambah Kontrak Payung"
              : `Edit Kontrak Payung — ${form.noKontrakPayung}`}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="max-h-[70vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Customer <span className="text-destructive">*</span>
            </label>
            <SearchableSelect
              value={form.customerId}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, customerId: v }))
              }
              options={customerOptions.map((c) => ({
                value: c.id,
                label: c.nama,
              }))}
              placeholder="Pilih customer..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                No. Kontrak Payung <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.noKontrakPayung}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    noKontrakPayung: e.target.value,
                  }))
                }
                placeholder="mis. KP/2026/007"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Nama Kontrak <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.namaKontrak}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, namaKontrak: e.target.value }))
                }
                placeholder="Nama kontrak payung"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Tanggal Kontrak <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                value={form.tanggalKontrak}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    tanggalKontrak: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Tanggal Mulai <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                value={form.tanggalMulai}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, tanggalMulai: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Tanggal Selesai <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                value={form.tanggalSelesai}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    tanggalSelesai: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Daftar Harga per Role (opsional)
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addHargaRoleRow}
                disabled={loadingDetail}
              >
                <PlusIcon className="size-3.5" />
                Tambah Baris
              </Button>
            </div>
            {loadingDetail ? (
              <p className="text-muted-foreground text-sm">
                Memuat daftar harga saat ini...
              </p>
            ) : form.hargaRole.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Belum ada daftar harga per role.
              </p>
            ) : (
              <div className="space-y-2">
                {form.hargaRole.map((row) => (
                  <div
                    key={row.key}
                    className="grid grid-cols-12 items-start gap-2 rounded-lg border p-2"
                  >
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="1"
                        value={row.roleId}
                        onChange={(e) =>
                          updateHargaRoleRow(row.key, {
                            roleId: e.target.value,
                          })
                        }
                        placeholder="Role (ID)"
                      />
                    </div>
                    <div className="col-span-3">
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant={
                            row.tipeHarga === "PER_BULAN"
                              ? "default"
                              : "outline"
                          }
                          onClick={() =>
                            updateHargaRoleRow(row.key, {
                              tipeHarga: "PER_BULAN",
                            })
                          }
                          className="flex-1 px-1 text-xs"
                        >
                          /Bulan
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={
                            row.tipeHarga === "PER_PROJECT"
                              ? "default"
                              : "outline"
                          }
                          onClick={() =>
                            updateHargaRoleRow(row.key, {
                              tipeHarga: "PER_PROJECT",
                            })
                          }
                          className="flex-1 px-1 text-xs"
                        >
                          /Proyek
                        </Button>
                      </div>
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        min="0"
                        value={row.nilai}
                        onChange={(e) =>
                          updateHargaRoleRow(row.key, { nilai: e.target.value })
                        }
                        placeholder="Nilai (Rp)"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        value={row.keterangan}
                        onChange={(e) =>
                          updateHargaRoleRow(row.key, {
                            keterangan: e.target.value,
                          })
                        }
                        placeholder="Keterangan"
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeHargaRoleRow(row.key)}
                        title="Hapus baris"
                        className="border-input text-destructive hover:bg-destructive/10 flex size-8 items-center justify-center rounded-md border"
                      >
                        <Trash2Icon className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-muted-foreground text-xs">
              Role diisi sebagai ID angka manual — belum ada endpoint dropdown
              nama peran proyek yang terdokumentasi.
            </p>
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
          <Button onClick={handleSave} disabled={saving || loadingDetail}>
            {saving
              ? "Menyimpan..."
              : form.id === null
                ? "Simpan Kontrak"
                : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
