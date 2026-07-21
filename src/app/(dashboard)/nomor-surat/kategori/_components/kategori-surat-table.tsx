"use client";

import { useState } from "react";
import {
  InfoIcon,
  LockIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast-manager";
import type {
  KategoriSurat,
  KategoriSuratStatus,
  KategoriSuratWithCount,
} from "@/lib/kategori-surat";
import type { ApiResponse } from "@/types/api";

interface FormState {
  id: number | null;
  kode: string;
  nama: string;
  status: KategoriSuratStatus;
}

const EMPTY_FORM: FormState = {
  id: null,
  kode: "",
  nama: "",
  status: "AKTIF",
};

export function KategoriSuratTable({
  initialItems,
}: {
  initialItems: KategoriSuratWithCount[];
}) {
  const [items, setItems] = useState(initialItems);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState<KategoriSuratWithCount | null>(null);
  const [deleting, setDeleting] = useState(false);

  function openAdd() {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(item: KategoriSuratWithCount) {
    setForm({
      id: item.id,
      kode: item.kode,
      nama: item.nama,
      status: item.status,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.kode.trim() || !form.nama.trim()) {
      toast.error("Kode dan nama kategori wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const isEdit = form.id !== null;
      const res = await fetch(
        isEdit
          ? `/api/proxy/master/kategori-surat/${form.id}`
          : "/api/proxy/master/kategori-surat",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kode: form.kode.trim(),
            nama: form.nama.trim(),
            status: form.status,
          }),
        },
      );
      const body: ApiResponse<KategoriSurat> = await res.json();
      if (!res.ok || !body.success || !body.data) {
        toast.error(body.message || "Gagal menyimpan kategori surat");
        return;
      }
      const saved = body.data;
      setItems((prev) => {
        if (isEdit) {
          // jumlahSurat bukan bagian response PUT — pertahankan nilai lokal
          // yang sudah ada, cuma field kategorinya yang diganti.
          return prev.map((it) =>
            it.id === saved.id ? { ...it, ...saved } : it,
          );
        }
        return [...prev, { ...saved, jumlahSurat: 0 }];
      });
      toast.success(
        isEdit
          ? "Kategori surat berhasil diperbarui"
          : "Kategori surat berhasil ditambahkan",
      );
      setDialogOpen(false);
    } catch {
      toast.error("Tidak dapat menghubungi server");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(item: KategoriSuratWithCount) {
    if (item.isDefault) return;
    setDeleteTarget(item);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/proxy/master/kategori-surat/${deleteTarget.id}`,
        { method: "DELETE" },
      );
      const body: ApiResponse<null> = await res.json();
      if (!res.ok || !body.success) {
        toast.error(body.message || "Gagal menghapus kategori surat");
        return;
      }
      setItems((prev) => prev.filter((it) => it.id !== deleteTarget.id));
      toast.success("Kategori surat berhasil dihapus");
      setDeleteTarget(null);
    } catch {
      toast.error("Tidak dapat menghubungi server");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm">
            Master data jenis surat keluar (DR-01 s.d. DR-09)
          </p>
        </div>
        <Button onClick={openAdd}>
          <PlusIcon className="size-4" />
          Tambah Kategori
        </Button>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
        <InfoIcon className="mt-0.5 size-4 shrink-0" />
        <p className="text-sm">
          <b>Format Nomor Surat:</b> [Urutan 3 digit]/[Kode Kategori]/SWA/
          [Bulan Romawi]/[Tahun] — Contoh:{" "}
          <code className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-xs dark:bg-blue-900">
            037/DR-01/SWA/VII/2026
          </code>{" "}
          (urutan ke-37, kategori DR-01, bulan Juli, tahun 2026). Nomor urut
          di-reset setiap tahun per kategori.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 border-b text-left">
              <th className="text-muted-foreground w-12 px-4 py-3 text-xs font-semibold">
                NO
              </th>
              <th className="text-muted-foreground px-4 py-3 text-xs font-semibold">
                KODE
              </th>
              <th className="text-muted-foreground px-4 py-3 text-xs font-semibold">
                NAMA KATEGORI
              </th>
              <th className="text-muted-foreground px-4 py-3 text-right text-xs font-semibold">
                JUMLAH SURAT
              </th>
              <th className="text-muted-foreground px-4 py-3 text-xs font-semibold">
                STATUS
              </th>
              <th className="text-muted-foreground px-4 py-3 text-right text-xs font-semibold">
                AKSI
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-muted-foreground p-6 text-center text-sm"
                >
                  Belum ada kategori surat.
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.id} className="border-b last:border-b-0">
                  <td className="text-muted-foreground px-4 py-3 align-top">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-col gap-1">
                      <Badge className="w-fit">{item.kode}</Badge>
                      {item.isDefault && (
                        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                          <LockIcon className="size-3" />
                          Default
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top font-medium">
                    {item.nama}
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    <span className="inline-flex min-w-8 items-center justify-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                      {item.jumlahSurat}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                        item.status === "AKTIF"
                          ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          item.status === "AKTIF"
                            ? "bg-green-500"
                            : "bg-muted-foreground/50",
                        )}
                      />
                      {item.status === "AKTIF" ? "Aktif" : "Tidak Aktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        title="Edit"
                        className="border-input text-primary hover:bg-muted flex size-8 items-center justify-center rounded-md border"
                      >
                        <PencilIcon className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        disabled={item.isDefault}
                        title={
                          item.isDefault
                            ? "Kategori default tidak bisa dihapus"
                            : "Hapus"
                        }
                        className="border-input text-muted-foreground hover:bg-muted flex size-8 items-center justify-center rounded-md border disabled:pointer-events-none disabled:opacity-40"
                      >
                        <Trash2Icon className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-primary-foreground">
              {form.id === null
                ? "Tambah Kategori Surat"
                : "Edit Kategori Surat"}
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Kode <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.kode}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, kode: e.target.value }))
                }
                placeholder="Contoh: DR-10"
                maxLength={10}
              />
              <p className="text-muted-foreground text-xs">
                Format: DR-xx (maks. 10 karakter)
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Nama Kategori <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.nama}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, nama: e.target.value }))
                }
                placeholder="Nama kategori surat..."
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
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-primary-foreground">
              Hapus Kategori Surat
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm">
              Hapus kategori{" "}
              <span className="font-semibold">
                &ldquo;{deleteTarget?.nama}&rdquo; ({deleteTarget?.kode})
              </span>
              ? Tindakan ini tidak bisa dibatalkan.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
