"use client";

import { useState } from "react";
import {
  Loader2Icon,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Role } from "@/lib/role";
import { toast } from "@/lib/toast-manager";
import { cn } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";
import { RoleFormDialog } from "./role-form-dialog";
import { RoleMenuTreeEditor } from "./role-menu-tree";
import { RolePermissionGrid } from "./role-permission-grid";

export function RolePermissionManager({
  initialRoles,
}: {
  initialRoles: Role[];
}) {
  const [roles, setRoles] = useState(initialRoles);
  const [selectedId, setSelectedId] = useState<number | null>(
    initialRoles[0]?.id ?? null,
  );
  const [tab, setTab] = useState("permission");

  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);

  const selectedRole = roles.find((r) => r.id === selectedId) ?? null;

  function openCreate() {
    setEditingRole(null);
    setFormOpen(true);
  }

  function openEdit(role: Role) {
    setEditingRole(role);
    setFormOpen(true);
  }

  function handleRoleSaved(saved: Role, isNew: boolean) {
    setRoles((prev) =>
      isNew
        ? [saved, ...prev]
        : prev.map((r) => (r.id === saved.id ? saved : r)),
    );
    if (isNew) setSelectedId(saved.id);
  }

  async function handleDeleteRole() {
    if (!deletingRole) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/proxy/master/roles/${deletingRole.id}`, {
        method: "DELETE",
      });
      const body: ApiResponse<null> = await res.json();
      if (!res.ok || !body.success) {
        toast.error(body.message || "Gagal menghapus role");
        return;
      }
      const removedId = deletingRole.id;
      setRoles((prev) => prev.filter((r) => r.id !== removedId));
      setSelectedId((cur) =>
        cur === removedId
          ? (roles.find((r) => r.id !== removedId)?.id ?? null)
          : cur,
      );
      toast.success("Role berhasil dihapus");
      setDeletingRole(null);
    } catch {
      toast.error("Tidak dapat menghubungi server");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">Role &amp; Permission</h1>
        <p className="text-muted-foreground text-sm">
          Pilih role untuk mengatur izin (apa yang boleh dilakukan) dan menu
          (apa yang terlihat). Keduanya independen — atur bersamaan.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Kolom kiri: daftar role */}
        <div className="space-y-2">
          <Button onClick={openCreate} className="w-full">
            <PlusIcon className="size-4" />
            Tambah Role
          </Button>
          <div className="overflow-hidden rounded-xl border">
            {roles.length === 0 ? (
              <p className="text-muted-foreground p-4 text-center text-sm">
                Belum ada role.
              </p>
            ) : (
              roles.map((role) => (
                <div
                  key={role.id}
                  className={cn(
                    "flex items-center gap-2 border-b px-3 py-2.5 last:border-b-0",
                    role.id === selectedId && "bg-muted",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(role.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {role.namaRole}
                      </span>
                      {role.status === "TIDAK_AKTIF" && (
                        <Badge variant="secondary" className="text-[10px]">
                          nonaktif
                        </Badge>
                      )}
                    </div>
                    <span className="text-muted-foreground font-mono text-xs">
                      {role.kodeRole}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(role)}
                    title="Edit role"
                    className="text-muted-foreground hover:text-primary shrink-0"
                  >
                    <PencilIcon className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingRole(role)}
                    title="Hapus role"
                    className="text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2Icon className="size-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Kolom kanan: tab permission / menu */}
        <div className="min-w-0">
          {selectedRole === null ? (
            <div className="text-muted-foreground rounded-xl border p-8 text-center text-sm">
              Pilih atau buat role untuk mulai mengatur izin dan menu.
            </div>
          ) : (
            <Tabs value={tab} onValueChange={(v) => setTab(v as string)}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">
                    {selectedRole.namaRole}
                  </p>
                  <p className="text-muted-foreground font-mono text-xs">
                    {selectedRole.kodeRole}
                  </p>
                </div>
                <TabsList>
                  <TabsTrigger value="permission">Permission</TabsTrigger>
                  <TabsTrigger value="menu">Menu</TabsTrigger>
                </TabsList>
              </div>

              {/* key={selectedRole.id} memaksa re-mount saat role berganti,
                  supaya grid/tree memuat ulang datanya dari nol. */}
              <TabsContent value="permission" className="mt-3">
                <RolePermissionGrid
                  key={selectedRole.id}
                  roleId={selectedRole.id}
                />
              </TabsContent>
              <TabsContent value="menu" className="mt-3">
                <RoleMenuTreeEditor
                  key={selectedRole.id}
                  roleId={selectedRole.id}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      <RoleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editingRole}
        onSaved={handleRoleSaved}
      />

      <Dialog
        open={deletingRole !== null}
        onOpenChange={(open) => !open && setDeletingRole(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-primary-foreground">
              Hapus Role
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm">
              Yakin ingin menghapus role{" "}
              <span className="font-semibold">{deletingRole?.namaRole}</span>?{" "}
              <span className="text-destructive font-medium">
                Hapus permanen — permission dan menu role ini ikut terhapus.
              </span>{" "}
              Role yang masih dipakai user akan ditolak (409).
            </p>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingRole(null)}
              disabled={deleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRole}
              disabled={deleting}
            >
              {deleting ? "Menghapus..." : "Hapus Permanen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
