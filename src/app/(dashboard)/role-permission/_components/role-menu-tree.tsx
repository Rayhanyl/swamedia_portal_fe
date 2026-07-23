"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2Icon, SaveIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  buildParentMap,
  collectAssignedIds,
  type RoleMenuNode,
  type RoleMenuTree,
} from "@/lib/role-menu";
import { toast } from "@/lib/toast-manager";
import type { ApiResponse } from "@/types/api";

// Kumpulkan id node + seluruh keturunannya (untuk uncheck berantai).
function collectSelfAndDescendants(node: RoleMenuNode): number[] {
  const ids = [node.id];
  for (const child of node.children) ids.push(...collectSelfAndDescendants(child));
  return ids;
}

function TreeRows({
  nodes,
  depth,
  checked,
  onToggle,
}: {
  nodes: RoleMenuNode[];
  depth: number;
  checked: Set<number>;
  onToggle: (node: RoleMenuNode, next: boolean) => void;
}) {
  return (
    <>
      {nodes.map((node) => (
        <div key={node.id}>
          <label
            className="hover:bg-muted/50 flex items-center gap-2 rounded-md px-2 py-1.5"
            style={{ paddingLeft: `${depth * 20 + 8}px` }}
          >
            <input
              type="checkbox"
              className="size-4"
              checked={checked.has(node.id)}
              onChange={(e) => onToggle(node, e.target.checked)}
            />
            <span className="text-sm font-medium">{node.namaMenu}</span>
            {node.path === null && (
              <Badge variant="outline" className="text-[10px]">
                grup
              </Badge>
            )}
            {node.status === "TIDAK_AKTIF" && (
              <Badge variant="secondary" className="text-[10px]">
                nonaktif
              </Badge>
            )}
            {node.path && (
              <span className="text-muted-foreground font-mono text-xs">
                {node.path}
              </span>
            )}
          </label>
          {node.children.length > 0 && (
            <TreeRows
              nodes={node.children}
              depth={depth + 1}
              checked={checked}
              onToggle={onToggle}
            />
          )}
        </div>
      ))}
    </>
  );
}

// Editor menu role: pohon menu penuh + checkbox `assigned`. Murni tampilan
// navigasi — TIDAK memberi izin (izin nyata ada di tab Permission). Saat
// mencentang anak, induk-induknya ikut dicentang otomatis (kalau tidak, menu
// anak bisa tak terjangkau di navigasi). Saat mencabut induk, seluruh
// keturunannya ikut tercabut supaya tidak ada anak yatim yang tetap tampil.
export function RoleMenuTreeEditor({ roleId }: { roleId: number }) {
  const [tree, setTree] = useState<RoleMenuNode[]>([]);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const parentMap = useMemo(() => buildParentMap(tree), [tree]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setTree([]);
    setChecked(new Set());
    fetch(`/api/proxy/master/role-menus/${roleId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((body: ApiResponse<RoleMenuTree>) => {
        if (cancelled) return;
        if (!body.success || !body.data) {
          toast.error(body.message || "Gagal memuat menu role");
          return;
        }
        setTree(body.data.items);
        setChecked(new Set(collectAssignedIds(body.data.items)));
      })
      .catch(() => {
        if (!cancelled) toast.error("Tidak dapat menghubungi server");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [roleId]);

  function handleToggle(node: RoleMenuNode, next: boolean) {
    setChecked((prev) => {
      const set = new Set(prev);
      if (next) {
        // Centang node + seluruh induknya ke atas.
        set.add(node.id);
        let parent = parentMap.get(node.id) ?? null;
        while (parent !== null && parent !== undefined) {
          set.add(parent);
          parent = parentMap.get(parent) ?? null;
        }
      } else {
        // Cabut node + seluruh keturunannya.
        for (const id of collectSelfAndDescendants(node)) set.delete(id);
      }
      return set;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/proxy/master/role-menus/${roleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuIds: Array.from(checked) }),
      });
      const body: ApiResponse<RoleMenuTree> = await res.json();
      if (!res.ok || !body.success || !body.data) {
        toast.error(body.message || "Gagal menyimpan menu role");
        return;
      }
      setTree(body.data.items);
      setChecked(new Set(collectAssignedIds(body.data.items)));
      toast.success("Menu role berhasil disimpan");
    } catch {
      toast.error("Tidak dapat menghubungi server");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 p-6 text-sm">
        <Loader2Icon className="size-4 animate-spin" />
        Memuat menu role...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">
          Centang menu yang tampil untuk role ini. Mencentang anak otomatis
          mencentang induknya; mencabut induk mencabut anak-anaknya.
        </p>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <SaveIcon className="size-4" />
          )}
          Simpan Menu
        </Button>
      </div>

      <div className="rounded-xl border p-2">
        {tree.length === 0 ? (
          <p className="text-muted-foreground p-4 text-center text-sm">
            Tidak ada menu.
          </p>
        ) : (
          <TreeRows
            nodes={tree}
            depth={0}
            checked={checked}
            onToggle={handleToggle}
          />
        )}
      </div>

      <p className="text-muted-foreground text-xs">
        Menu hanya mengatur tampilan navigasi, bukan izin. Selaraskan dengan tab
        Permission: menu yang tampil tapi modulnya tak boleh dibaca akan
        berujung <b>403</b> saat diklik.
      </p>
    </div>
  );
}
