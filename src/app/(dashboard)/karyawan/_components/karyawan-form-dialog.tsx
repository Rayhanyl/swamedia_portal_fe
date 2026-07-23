"use client";

import { useEffect, useRef, useState } from "react";

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
import type { Jabatan } from "@/lib/jabatan";
import type {
  Karyawan,
  KaryawanDetail,
  KaryawanNikPreview,
  KaryawanStatus,
  TipeKaryawan,
} from "@/lib/karyawan";
import type { Unit } from "@/lib/unit";
import type { ApiResponse } from "@/types/api";

interface FormState {
  id: number | null;
  nik: string;
  nama: string;
  jabatanId: number | null;
  unitId: number | null;
  tipeKaryawan: TipeKaryawan;
  email: string;
  noHp: string;
  tanggalMasuk: string;
  status: KaryawanStatus;
  subjectId: string;
}

function emptyForm(): FormState {
  return {
    id: null,
    nik: "",
    nama: "",
    jabatanId: null,
    unitId: null,
    tipeKaryawan: "P",
    email: "",
    noHp: "",
    tanggalMasuk: "",
    status: "AKTIF",
    subjectId: "",
  };
}

function formFromKaryawan(item: Karyawan): FormState {
  return {
    id: item.id,
    nik: item.nik,
    nama: item.nama,
    jabatanId: item.jabatan.id,
    unitId: item.unitId,
    tipeKaryawan: item.tipeKaryawan,
    email: item.email ?? "",
    noHp: item.noHp ?? "",
    tanggalMasuk: item.tanggalMasuk ?? "",
    status: item.status,
    subjectId: "",
  };
}

export function KaryawanFormDialog({
  open,
  onOpenChange,
  editing,
  unitOptions,
  jabatanOptions,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Karyawan | null;
  unitOptions: Unit[];
  jabatanOptions: Jabatan[];
  onSaved: (saved: Karyawan) => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingNikSuggestion, setLoadingNikSuggestion] = useState(false);
  // true selama NIK di form masih murni hasil saran otomatis (belum pernah
  // diedit manual oleh user) — dipakai supaya efek saran NIK di bawah tahu
  // aman untuk terus memperbarui field NIK saat Unit/Tipe/Tanggal Masuk
  // berubah, tapi berhenti begitu user mengetik sendiri di field NIK.
  const nikAutoFilledRef = useRef(true);

  useEffect(() => {
    if (!open) return;
    if (!editing) {
      setForm(emptyForm());
      nikAutoFilledRef.current = true;
      return;
    }
    setForm(formFromKaryawan(editing));

    // subjectId tidak pernah ada di list — ambil dari GET detail supaya PUT
    // (full replace) tidak diam-diam memutus tautan akun portal yang sudah
    // ada saat user mengedit field lain tanpa berniat mengubah subjectId.
    let cancelled = false;
    setLoadingDetail(true);
    fetch(`/api/proxy/master/karyawan/${editing.id}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((body: ApiResponse<KaryawanDetail>) => {
        if (cancelled || !body.success || !body.data) return;
        setForm((prev) => ({ ...prev, subjectId: body.data!.subjectId ?? "" }));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, editing]);

  // Saran NIK otomatis — hanya untuk Tambah (bukan Edit, yang sudah punya NIK
  // sendiri). Backend butuh unit + tipe karyawan (keduanya ikut menyusun
  // huruf di NIK: SWA-{tahun}{urutan}{P|C}{kode unit}), jadi efek ini baru
  // jalan setelah Unit dipilih, dan otomatis menyusun ulang saran setiap kali
  // Unit/Tipe Karyawan/Tanggal Masuk berubah. Preview murni (tidak me-reserve
  // apa pun di backend) — user tetap bisa mengedit manual sebelum simpan;
  // `nikAutoFilledRef` memastikan begitu user mengetik sendiri, efek ini
  // berhenti menimpa field NIK.
  useEffect(() => {
    if (!open || editing) return;
    if (!form.unitId) return;
    if (!nikAutoFilledRef.current) return;

    let cancelled = false;
    setLoadingNikSuggestion(true);
    const params = new URLSearchParams();
    params.set("unit_id", String(form.unitId));
    params.set("tipe_karyawan", form.tipeKaryawan);
    if (form.tanggalMasuk) {
      params.set("tahun", form.tanggalMasuk.slice(0, 4));
    }
    fetch(`/api/proxy/master/karyawan/preview-nik?${params.toString()}`, {
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((body: ApiResponse<KaryawanNikPreview>) => {
        if (cancelled || !nikAutoFilledRef.current) return;
        if (!body.success || !body.data) return;
        setForm((prev) => ({ ...prev, nik: body.data!.nikPreview }));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingNikSuggestion(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, form.unitId, form.tipeKaryawan, form.tanggalMasuk]);

  async function handleSave() {
    if (!form.nik.trim() || !form.nama.trim()) {
      toast.error("NIK dan nama karyawan wajib diisi");
      return;
    }
    if (!form.jabatanId || !form.unitId) {
      toast.error("Jabatan dan unit wajib dipilih");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Email wajib diisi");
      return;
    }

    setSaving(true);
    try {
      const isEdit = form.id !== null;
      const body = {
        nik: form.nik.trim(),
        nama: form.nama.trim(),
        jabatanId: form.jabatanId,
        unitId: form.unitId,
        tipeKaryawan: form.tipeKaryawan,
        email: form.email.trim(),
        noHp: form.noHp.trim() || null,
        tanggalMasuk: form.tanggalMasuk || null,
        status: form.status,
        subjectId: form.subjectId.trim() || null,
      };
      const res = await fetch(
        isEdit
          ? `/api/proxy/master/karyawan/${form.id}`
          : "/api/proxy/master/karyawan",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const resBody: ApiResponse<Karyawan> = await res.json();
      if (!res.ok || !resBody.success || !resBody.data) {
        toast.error(resBody.message || "Gagal menyimpan karyawan");
        return;
      }
      onSaved(resBody.data);
      toast.success(
        isEdit ? "Karyawan berhasil diperbarui" : "Karyawan berhasil ditambahkan",
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
            {form.id === null ? "Tambah Karyawan Baru" : "Edit Karyawan"}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                NIK <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.nik}
                onChange={(e) => {
                  nikAutoFilledRef.current = false;
                  setForm((prev) => ({ ...prev, nik: e.target.value }));
                }}
                placeholder={
                  loadingNikSuggestion
                    ? "Memuat saran NIK berikutnya..."
                    : "Nomor induk karyawan"
                }
              />
              {form.id === null && (
                <p className="text-muted-foreground text-xs">
                  {form.unitId
                    ? "NIK berikutnya terisi otomatis mengikuti Unit/Tipe Karyawan/Tanggal Masuk — tetap bisa diubah manual."
                    : "Pilih Unit terlebih dahulu agar NIK terisi otomatis."}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Nama <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.nama}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, nama: e.target.value }))
                }
                placeholder="Nama lengkap karyawan"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Jabatan <span className="text-destructive">*</span>
              </label>
              <SearchableSelect
                value={form.jabatanId}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, jabatanId: v }))
                }
                options={jabatanOptions.map((j) => ({
                  value: j.id,
                  label: j.namaJabatan,
                }))}
                placeholder="Pilih jabatan..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Unit <span className="text-destructive">*</span>
              </label>
              <SearchableSelect
                value={form.unitId}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, unitId: v }))
                }
                options={unitOptions.map((u) => ({
                  value: u.id,
                  label: u.namaUnit,
                }))}
                placeholder="Pilih unit..."
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Tipe Karyawan <span className="text-destructive">*</span>
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={form.tipeKaryawan === "P" ? "default" : "outline"}
                onClick={() =>
                  setForm((prev) => ({ ...prev, tipeKaryawan: "P" }))
                }
                className="flex-1"
              >
                Pegawai Tetap
              </Button>
              <Button
                type="button"
                variant={form.tipeKaryawan === "C" ? "default" : "outline"}
                onClick={() =>
                  setForm((prev) => ({ ...prev, tipeKaryawan: "C" }))
                }
                className="flex-1"
              >
                Kontrak
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Email <span className="text-destructive">*</span>
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="nama@swamedia.co.id"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">No. HP</label>
              <Input
                value={form.noHp}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, noHp: e.target.value }))
                }
                placeholder="081234567890"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tanggal Masuk</label>
              <Input
                type="date"
                value={form.tanggalMasuk}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    tanggalMasuk: e.target.value,
                  }))
                }
              />
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
                  variant={
                    form.status === "TIDAK_AKTIF" ? "default" : "outline"
                  }
                  onClick={() =>
                    setForm((prev) => ({ ...prev, status: "TIDAK_AKTIF" }))
                  }
                  className="flex-1"
                >
                  Tidak Aktif
                </Button>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Subject ID Akun Portal (opsional)
            </label>
            <Input
              value={form.subjectId}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, subjectId: e.target.value }))
              }
              disabled={loadingDetail}
              placeholder={
                loadingDetail
                  ? "Memuat tautan akun saat ini..."
                  : "UUID akun WSO2 IS, kosongkan bila belum ada akun"
              }
            />
            <p className="text-muted-foreground text-xs">
              Tautan manual ke akun WSO2 Identity Server — tidak semua
              karyawan punya akun portal.
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
                ? "Simpan Karyawan"
                : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
