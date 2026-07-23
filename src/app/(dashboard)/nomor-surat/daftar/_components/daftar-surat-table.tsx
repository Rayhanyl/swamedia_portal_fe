"use client";

import { useRef, useState } from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast-manager";
import type { DaftarSurat, DaftarSuratPage } from "@/lib/daftar-surat";
import type { KategoriSurat } from "@/lib/kategori-surat";
import type { ProyekDropdownItem } from "@/lib/proyek";
import type { ApiResponse, Pagination } from "@/types/api";

interface FormState {
  id: number | null;
  kategoriSuratId: number | null;
  kategoriKode: string;
  kategoriNama: string;
  proyekId: number | null;
  tanggal: string;
  tujuan: string;
  perihal: string;
  keterangan: string;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function emptyForm(defaultKategori: KategoriSurat | undefined): FormState {
  return {
    id: null,
    kategoriSuratId: defaultKategori?.id ?? null,
    kategoriKode: defaultKategori?.kode ?? "",
    kategoriNama: defaultKategori?.nama ?? "",
    proyekId: null,
    tanggal: todayIso(),
    tujuan: "",
    perihal: "",
    keterangan: "",
  };
}

const TAHUN_OPTIONS = Array.from(
  { length: 5 },
  (_, i) => new Date().getFullYear() - i,
);

function formatTanggal(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function DaftarSuratTable({
  initialPage,
  initialTahun,
  kategoriOptions,
  proyekOptions,
}: {
  initialPage: DaftarSuratPage;
  initialTahun: number;
  kategoriOptions: KategoriSurat[];
  proyekOptions: ProyekDropdownItem[];
}) {
  const [items, setItems] = useState(initialPage.items);
  const [pagination, setPagination] = useState<Pagination | null>(
    initialPage.pagination,
  );
  const [search, setSearch] = useState("");
  const [tahun, setTahun] = useState(initialTahun);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm(kategoriOptions[0]));
  const [saving, setSaving] = useState(false);

  const [cancelTarget, setCancelTarget] = useState<DaftarSurat | null>(null);
  const [alasanPembatalan, setAlasanPembatalan] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchPage(overrides: {
    search?: string;
    tahun?: number;
    page?: number;
  }) {
    const nextSearch = overrides.search ?? search;
    const nextTahun = overrides.tahun ?? tahun;
    const nextPage = overrides.page ?? 1;
    const query = new URLSearchParams();
    if (nextSearch) query.set("search", nextSearch);
    query.set("tahun", String(nextTahun));
    query.set("page", String(nextPage));
    query.set("limit", "20");
    setLoading(true);
    try {
      const res = await fetch(
        `/api/proxy/business/daftar-surat?${query.toString()}`,
        { cache: "no-store" },
      );
      const body: ApiResponse<DaftarSurat[]> = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.message || "Gagal memuat daftar surat");
      }
      setItems(body.data ?? []);
      setPagination(body.meta.pagination ?? null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memuat daftar surat",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchPage({ search: value, page: 1 });
    }, 400);
  }

  function handleTahunChange(value: number) {
    setTahun(value);
    fetchPage({ tahun: value, page: 1 });
  }

  function openAdd() {
    setForm(emptyForm(kategoriOptions[0]));
    setDialogOpen(true);
  }

  function openEdit(item: DaftarSurat) {
    setForm({
      id: item.id,
      kategoriSuratId: item.kategoriSuratId,
      kategoriKode: item.kategoriKode,
      kategoriNama: item.kategoriNama,
      proyekId: item.proyekId,
      tanggal: item.tanggal,
      tujuan: item.tujuan,
      perihal: item.perihal,
      keterangan: item.keterangan ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.kategoriSuratId) {
      toast.error("Kategori surat wajib dipilih");
      return;
    }
    if (!form.tanggal || !form.tujuan.trim() || !form.perihal.trim()) {
      toast.error("Tanggal, tujuan, dan perihal wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const isEdit = form.id !== null;
      const body = isEdit
        ? {
            tanggal: form.tanggal,
            proyekId: form.proyekId,
            tujuan: form.tujuan.trim(),
            perihal: form.perihal.trim(),
            keterangan: form.keterangan.trim() || null,
          }
        : {
            kategoriSuratId: form.kategoriSuratId,
            proyekId: form.proyekId,
            tanggal: form.tanggal,
            tujuan: form.tujuan.trim(),
            perihal: form.perihal.trim(),
            keterangan: form.keterangan.trim() || null,
          };
      const res = await fetch(
        isEdit
          ? `/api/proxy/business/daftar-surat/${form.id}`
          : "/api/proxy/business/daftar-surat",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const resBody: ApiResponse<DaftarSurat> = await res.json();
      if (!res.ok || !resBody.success || !resBody.data) {
        toast.error(resBody.message || "Gagal menyimpan surat");
        return;
      }
      const saved = resBody.data;
      setItems((prev) =>
        isEdit
          ? prev.map((it) => (it.id === saved.id ? saved : it))
          : [saved, ...prev],
      );
      toast.success(
        isEdit ? "Surat berhasil diperbarui" : "Surat berhasil ditambahkan",
      );
      setDialogOpen(false);
    } catch {
      toast.error("Tidak dapat menghubungi server");
    } finally {
      setSaving(false);
    }
  }

  function openCancel(item: DaftarSurat) {
    setAlasanPembatalan("");
    setCancelTarget(item);
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    if (alasanPembatalan.trim().length < 5) {
      toast.error("Alasan pembatalan minimal 5 karakter");
      return;
    }
    setCancelling(true);
    try {
      const res = await fetch(
        `/api/proxy/business/daftar-surat/${cancelTarget.id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alasanPembatalan: alasanPembatalan.trim() }),
        },
      );
      const body: ApiResponse<{ id: number }> = await res.json();
      if (!res.ok || !body.success) {
        toast.error(body.message || "Gagal membatalkan surat");
        return;
      }
      setItems((prev) => prev.filter((it) => it.id !== cancelTarget.id));
      toast.success("Surat berhasil dibatalkan");
      setCancelTarget(null);
    } catch {
      toast.error("Tidak dapat menghubungi server");
    } finally {
      setCancelling(false);
    }
  }

  const totalItems = pagination?.totalItems ?? items.length;
  const currentPageNum = pagination?.page ?? 1;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative w-full max-w-xs">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari nomor / tujuan..."
              className="pl-8"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="border-input bg-background flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm whitespace-nowrap"
                />
              }
            >
              <span className="text-muted-foreground">Tahun:</span>
              <span className="font-medium">{tahun}</span>
              <ChevronDownIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup
                value={String(tahun)}
                onValueChange={(value) => handleTahunChange(Number(value))}
              >
                {TAHUN_OPTIONS.map((y) => (
                  <DropdownMenuRadioItem key={y} value={String(y)} closeOnClick>
                    {y}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          {loading && (
            <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
          )}
        </div>
        <Button onClick={openAdd} disabled={kategoriOptions.length === 0}>
          <PlusIcon className="size-4" />
          Tambah Surat
        </Button>
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-xl border",
          loading && "pointer-events-none opacity-60",
        )}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 border-b text-left">
              <th className="text-muted-foreground px-4 py-3 text-xs font-semibold">
                NO. SURAT
              </th>
              <th className="text-muted-foreground px-4 py-3 text-xs font-semibold">
                TANGGAL
              </th>
              <th className="text-muted-foreground px-4 py-3 text-xs font-semibold">
                TUJUAN / PROYEK
              </th>
              <th className="text-muted-foreground px-4 py-3 text-xs font-semibold">
                PERIHAL
              </th>
              <th className="text-muted-foreground px-4 py-3 text-xs font-semibold">
                KETERANGAN
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
                  Belum ada surat.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{item.nomor}</span>
                      <Badge className="w-fit">{item.kategoriKode}</Badge>
                    </div>
                  </td>
                  <td className="text-muted-foreground px-4 py-3 align-top whitespace-nowrap">
                    {formatTanggal(item.tanggal)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{item.tujuan}</span>
                      {item.kodeProyek && (
                        <span className="text-primary text-xs font-medium">
                          {item.kodeProyek}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">{item.perihal}</td>
                  <td className="text-muted-foreground px-4 py-3 align-top">
                    {item.keterangan || "—"}
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
                        onClick={() => openCancel(item)}
                        title="Batalkan Surat"
                        className="border-input text-muted-foreground hover:bg-muted flex size-8 items-center justify-center rounded-md border"
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

      {items.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">
            Menampilkan {items.length} dari {totalItems} surat
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchPage({ page: currentPageNum - 1 })}
                disabled={currentPageNum <= 1 || loading}
                className="border-input hover:bg-muted flex size-8 items-center justify-center rounded-md border disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronLeftIcon className="size-3.5" />
              </button>
              <span className="text-muted-foreground text-sm whitespace-nowrap">
                Halaman {currentPageNum} dari {totalPages}
              </span>
              <button
                type="button"
                onClick={() => fetchPage({ page: currentPageNum + 1 })}
                disabled={currentPageNum >= totalPages || loading}
                className="border-input hover:bg-muted flex size-8 items-center justify-center rounded-md border disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronRightIcon className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-primary-foreground">
              {form.id === null ? "Tambah Surat" : "Edit Surat"}
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Kategori Surat <span className="text-destructive">*</span>
              </label>
              {form.id === null ? (
                <SearchableSelect
                  value={form.kategoriSuratId}
                  onValueChange={(v) => {
                    const selected = kategoriOptions.find((k) => k.id === v);
                    setForm((prev) => ({
                      ...prev,
                      kategoriSuratId: selected?.id ?? null,
                      kategoriKode: selected?.kode ?? "",
                      kategoriNama: selected?.nama ?? "",
                    }));
                  }}
                  options={kategoriOptions.map((k) => ({
                    value: k.id,
                    label: `${k.kode} — ${k.nama}`,
                  }))}
                  placeholder="Pilih kategori..."
                />
              ) : (
                <div className="border-input bg-muted/40 text-muted-foreground flex h-8 items-center rounded-lg border px-2.5 text-sm">
                  {form.kategoriKode} — {form.kategoriNama}
                </div>
              )}
              {form.id !== null && (
                <p className="text-muted-foreground text-xs">
                  Kategori tidak bisa diubah setelah surat dibuat.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Tanggal <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                value={form.tanggal}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, tanggal: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Proyek</label>
              <SearchableSelect
                value={form.proyekId}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, proyekId: v }))
                }
                options={proyekOptions.map((p) => ({
                  value: p.id,
                  label: `${p.kodeProyek} — ${p.namaProyek}`,
                }))}
                placeholder="Tidak ada proyek terkait"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Tujuan <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.tujuan}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, tujuan: e.target.value }))
                }
                placeholder="Nama instansi/perusahaan tujuan..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Perihal <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.perihal}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, perihal: e.target.value }))
                }
                placeholder="Perihal surat..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Keterangan</label>
              <textarea
                value={form.keterangan}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, keterangan: e.target.value }))
                }
                placeholder="Catatan tambahan (opsional)..."
                rows={2}
                className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:ring-3"
              />
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
        open={cancelTarget !== null}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-primary-foreground">
              Batalkan Surat
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm">
              Batalkan surat{" "}
              <span className="font-semibold">
                &ldquo;{cancelTarget?.nomor}&rdquo;
              </span>
              ? Surat tidak dihapus, hanya ditandai dibatalkan untuk jejak
              audit.
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Alasan Pembatalan <span className="text-destructive">*</span>
              </label>
              <textarea
                value={alasanPembatalan}
                onChange={(e) => setAlasanPembatalan(e.target.value)}
                placeholder="Minimal 5 karakter..."
                rows={2}
                className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:ring-3"
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelTarget(null)}
              disabled={cancelling}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancel}
              disabled={cancelling || alasanPembatalan.trim().length < 5}
            >
              {cancelling ? "Membatalkan..." : "Batalkan Surat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
