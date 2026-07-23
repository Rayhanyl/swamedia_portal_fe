// Tipe + helper murni untuk Role Menu — lihat
// documentation/note/api/04-rbac.md#modul-role-menu.
// GET /api/v1/master/role-menus/{roleId} mengembalikan SELURUH pohon menu
// (bukan hanya yang ditugaskan), tiap node ditandai `assigned`. Murni
// tampilan — TIDAK memberi izin apa pun (izin nyata ada di Role Permission).
// PUT mengganti seluruh set menu via `menuIds`.
//
// PENTING: file ini SENGAJA tidak mengimpor fetchBackend/next/headers supaya
// aman diimpor sebagai NILAI (bukan cuma tipe) dari Client Component —
// role-menu-tree.tsx memakai collectAssignedIds/buildParentMap di browser.
// Pola yang sama dengan lib/*-status.ts dan lib/laporan-unit.ts. Pengambilan
// datanya sendiri dilakukan client-side lewat /api/proxy/master/role-menus.

export type MenuStatus = "AKTIF" | "TIDAK_AKTIF";

export interface RoleMenuNode {
  id: number;
  parentId: number | null;
  kodeMenu: string;
  namaMenu: string;
  // null = node grup murni (wadah, tak bisa diklik di navigasi).
  path: string | null;
  icon: string | null;
  urutan: number;
  status: MenuStatus;
  assigned: boolean;
  children: RoleMenuNode[];
}

export interface RoleMenuTree {
  roleId: number;
  kodeRole: string;
  namaRole: string;
  items: RoleMenuNode[];
}

// Kumpulkan semua id yang `assigned: true` dari pohon (rekursif) — dipakai
// sebagai state awal checkbox di layar.
export function collectAssignedIds(nodes: RoleMenuNode[]): number[] {
  const ids: number[] = [];
  const walk = (list: RoleMenuNode[]) => {
    for (const node of list) {
      if (node.assigned) ids.push(node.id);
      if (node.children.length) walk(node.children);
    }
  };
  walk(nodes);
  return ids;
}

// Peta id → id induk, untuk auto-centang induk saat anak dicentang.
export function buildParentMap(
  nodes: RoleMenuNode[],
): Map<number, number | null> {
  const map = new Map<number, number | null>();
  const walk = (list: RoleMenuNode[]) => {
    for (const node of list) {
      map.set(node.id, node.parentId);
      if (node.children.length) walk(node.children);
    }
  };
  walk(nodes);
  return map;
}
