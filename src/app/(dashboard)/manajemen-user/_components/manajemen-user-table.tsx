"use client";

import { useRef, useState } from "react";
import {
  ChevronDownIcon,
  KeyRoundIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  PowerIcon,
  SearchIcon,
  ShieldIcon,
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
import type { PortalUser, UserPage } from "@/lib/manajemen-user";
import type { Role } from "@/lib/role";
import { toast } from "@/lib/toast-manager";
import { cn } from "@/lib/utils";
import type { ApiResponse, Pagination } from "@/types/api";
import { UserFormDialog } from "./user-form-dialog";
import { UserRoleDialog } from "./user-role-dialog";
import { UserPasswordDialog } from "./user-password-dialog";

function FilterDropdown({
  value,
  fallbackLabel,
  options,
  onChange,
}: {
  value: string;
  fallbackLabel: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const current =
    options.find((o) => o.value === value)?.label ?? fallbackLabel;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="border-input bg-background flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm whitespace-nowrap"
          />
        }
      >
        {current}
        <ChevronDownIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {options.map((opt) => (
            <DropdownMenuRadioItem
              key={opt.value || "__all__"}
              value={opt.value}
              closeOnClick
            >
              {opt.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function formatWaktu(iso: string | null) {
  if (!iso) return "Belum pernah";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

// Status akun WSO2 IS umumnya "ACTIVE"; nilai selain itu (mis. "INACTIVE")
// dianggap nonaktif. Perbandingan dilakukan case-insensitive supaya aman.
function isActive(status: string | null): boolean {
  return (status ?? "").toUpperCase() === "ACTIVE";
}

export function ManajemenUserTable({
  initialPage,
  roleOptions,
}: {
  initialPage: UserPage;
  roleOptions: Role[];
}) {
  const [items, setItems] = useState(initialPage.items);
  const [pagination, setPagination] = useState<Pagination | null>(
    initialPage.pagination,
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingUser, setEditingUser] = useState<PortalUser | null>(null);

  const [roleUser, setRoleUser] = useState<PortalUser | null>(null);
  const [passwordUser, setPasswordUser] = useState<PortalUser | null>(null);

  const [statusUser, setStatusUser] = useState<PortalUser | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchPage(overrides: {
    search?: string;
    status?: string;
  }) {
    const nextSearch = overrides.search ?? search;
    const nextStatus = overrides.status ?? statusFilter;

    const query = new URLSearchParams();
    if (nextSearch) query.set("search", nextSearch);
    if (nextStatus) query.set("status", nextStatus);
    query.set("page", "1");
    query.set("limit", "100");

    setLoading(true);
    try {
      const res = await fetch(`/api/proxy/manajemen-user?${query.toString()}`, {
        cache: "no-store",
      });
      const body: ApiResponse<PortalUser[]> = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.message || "Gagal memuat daftar user");
      }
      setItems(body.data ?? []);
      setPagination(body.meta.pagination ?? null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memuat daftar user",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchPage({ search: value }), 400);
  }

  function openCreate() {
    setFormMode("create");
    setEditingUser(null);
    setFormOpen(true);
  }

  function openEdit(user: PortalUser) {
    setFormMode("edit");
    setEditingUser(user);
    setFormOpen(true);
  }

  function upsertUser(saved: PortalUser) {
    setItems((prev) =>
      prev.some((u) => u.subjectId === saved.subjectId)
        ? prev.map((u) => (u.subjectId === saved.subjectId ? saved : u))
        : [saved, ...prev],
    );
  }

  async function handleToggleStatus() {
    if (!statusUser) return;
    const nextActive = !isActive(statusUser.status);
    setStatusSaving(true);
    try {
      const res = await fetch(
        `/api/proxy/manajemen-user/${statusUser.subjectId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: nextActive }),
        },
      );
      const body: ApiResponse<PortalUser> = await res.json();
      if (!res.ok || !body.success || !body.data) {
        toast.error(body.message || "Gagal mengubah status user");
        return;
      }
      upsertUser(body.data);
      toast.success(
        nextActive ? "Akun berhasil diaktifkan" : "Akun berhasil dinonaktifkan",
      );
      setStatusUser(null);
    } catch {
      toast.error("Tidak dapat menghubungi server");
    } finally {
      setStatusSaving(false);
    }
  }

  const totalItems = pagination?.totalItems ?? items.length;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Manajemen User</h1>
          <Button onClick={openCreate}>
            <PlusIcon className="size-4" />
            Tambah User
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">Filter:</span>
          <FilterDropdown
            value={statusFilter}
            fallbackLabel="Semua Status"
            options={[
              { value: "", label: "Semua Status" },
              { value: "ACTIVE", label: "Aktif" },
              { value: "INACTIVE", label: "Nonaktif" },
            ]}
            onChange={(v) => {
              setStatusFilter(v);
              fetchPage({ status: v });
            }}
          />
          <div className="relative">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari nama/email..."
              className="w-56 pl-8"
            />
          </div>
          {loading && (
            <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
          )}
        </div>
      </div>

      <div
        className={cn(
          "overflow-x-auto rounded-xl border",
          loading && "pointer-events-none opacity-60",
        )}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary text-primary-foreground text-left">
              <th className="px-4 py-3 text-xs font-semibold">NO</th>
              <th className="px-4 py-3 text-xs font-semibold">NAMA</th>
              <th className="px-4 py-3 text-xs font-semibold">EMAIL</th>
              <th className="px-4 py-3 text-xs font-semibold">STATUS</th>
              <th className="px-4 py-3 text-xs font-semibold">KARYAWAN</th>
              <th className="px-4 py-3 text-xs font-semibold">SINKRON</th>
              <th className="px-4 py-3 text-right text-xs font-semibold">
                AKSI
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-muted-foreground p-6 text-center text-sm"
                >
                  Belum ada user.
                </td>
              </tr>
            ) : (
              items.map((user, index) => {
                const active = isActive(user.status);
                return (
                  <tr key={user.subjectId} className="border-b last:border-b-0">
                    <td className="text-muted-foreground px-4 py-3 align-top">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 align-top font-medium">
                      {user.nama ?? "—"}
                    </td>
                    <td className="text-muted-foreground px-4 py-3 align-top">
                      {user.email ?? "—"}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Badge variant={active ? "default" : "outline"}>
                        {active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {user.karyawanNama ? (
                        <span>{user.karyawanNama}</span>
                      ) : (
                        <span className="text-muted-foreground italic">
                          belum tertaut
                        </span>
                      )}
                    </td>
                    <td className="text-muted-foreground px-4 py-3 align-top whitespace-nowrap">
                      {formatWaktu(user.lastSyncedAt)}
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(user)}
                          title="Edit profil (nama/email)"
                          className="border-input text-primary hover:bg-muted flex size-8 items-center justify-center rounded-md border"
                        >
                          <PencilIcon className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRoleUser(user)}
                          title="Atur role"
                          className="border-input text-primary hover:bg-muted flex size-8 items-center justify-center rounded-md border"
                        >
                          <ShieldIcon className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPasswordUser(user)}
                          title="Reset password"
                          className="border-input text-primary hover:bg-muted flex size-8 items-center justify-center rounded-md border"
                        >
                          <KeyRoundIcon className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatusUser(user)}
                          title={active ? "Nonaktifkan akun" : "Aktifkan akun"}
                          className={cn(
                            "border-input hover:bg-muted flex size-8 items-center justify-center rounded-md border",
                            active ? "text-destructive" : "text-emerald-600",
                          )}
                        >
                          <PowerIcon className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {items.length > 0 && pagination && totalItems > items.length && (
        <p className="text-muted-foreground text-sm">
          Menampilkan {items.length} dari {totalItems} user. Gunakan pencarian
          atau filter untuk mempersempit hasil.
        </p>
      )}

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        editing={editingUser}
        roleOptions={roleOptions}
        onSaved={upsertUser}
      />

      <UserRoleDialog
        user={roleUser}
        roleOptions={roleOptions}
        onOpenChange={(open) => !open && setRoleUser(null)}
      />

      <UserPasswordDialog
        user={passwordUser}
        onOpenChange={(open) => !open && setPasswordUser(null)}
      />

      <Dialog
        open={statusUser !== null}
        onOpenChange={(open) => !open && setStatusUser(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-primary-foreground">
              {statusUser && isActive(statusUser.status)
                ? "Nonaktifkan Akun"
                : "Aktifkan Akun"}
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm">
              {statusUser && isActive(statusUser.status) ? (
                <>
                  Nonaktifkan akun{" "}
                  <span className="font-semibold">{statusUser?.nama}</span>?
                  User tidak akan bisa login berikutnya. Token yang sudah
                  beredar tetap sah sampai kedaluwarsa.
                </>
              ) : (
                <>
                  Aktifkan kembali akun{" "}
                  <span className="font-semibold">{statusUser?.nama}</span>?
                </>
              )}
            </p>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusUser(null)}
              disabled={statusSaving}
            >
              Batal
            </Button>
            <Button
              variant={
                statusUser && isActive(statusUser.status)
                  ? "destructive"
                  : "default"
              }
              onClick={handleToggleStatus}
              disabled={statusSaving}
            >
              {statusSaving
                ? "Menyimpan..."
                : statusUser && isActive(statusUser.status)
                  ? "Nonaktifkan"
                  : "Aktifkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
