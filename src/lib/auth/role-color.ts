// Warna avatar per role — dipakai di mana pun AvatarFallback user dirender
// (nav-user.tsx, dashboard-user-menu.tsx, dst) supaya user dengan role yang
// sama selalu tampil dengan warna yang sama di seluruh aplikasi. Tiap entri
// pasang bg+text sendiri (bukan cuma bg) supaya kontras inisial tetap bagus
// per warna (kuning misalnya butuh teks gelap, bukan putih).
const ROLE_AVATAR_COLORS: Record<number, string> = {
  1: "bg-blue-600 text-white", // Biru
  2: "bg-green-600 text-white", // Hijau
  3: "bg-orange-500 text-white", // Oranye
  4: "bg-yellow-400 text-yellow-950", // Kuning
  5: "bg-pink-500 text-white", // Pink
};

const DEFAULT_AVATAR_COLOR = "bg-muted text-muted-foreground";

export function getRoleAvatarColor(
  roleId: string | number | null | undefined,
): string {
  if (roleId === null || roleId === undefined) return DEFAULT_AVATAR_COLOR;
  const id = typeof roleId === "string" ? Number(roleId) : roleId;
  return ROLE_AVATAR_COLORS[id] ?? DEFAULT_AVATAR_COLOR;
}
