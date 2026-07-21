import type { AuthUser } from "@/types/auth";
import { getRoleAvatarColor } from "@/lib/auth/role-color";

export interface UserDisplay {
  name: string;
  email: string;
  avatar: string;
  initials: string;
  roleLabel?: string;
  avatarColorClassName: string;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

// Klaim id_token WSO2 IS (AuthUser) longgar bentuknya, jadi setiap field di
// sini defensif: nama bisa datang dari `name` langsung atau disusun dari
// `given_name`/`family_name`, avatar (`picture`) sering tidak ada sama
// sekali di WSO2 IS.
export function getUserDisplay(user: AuthUser | null): UserDisplay {
  const email = asString(user?.email) ?? "";
  const givenFamily = [asString(user?.given_name), asString(user?.family_name)]
    .filter((part): part is string => Boolean(part))
    .join(" ");
  const name = asString(user?.name) || givenFamily || email || "Pengguna";
  const avatar = asString(user?.picture) ?? "";

  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U";

  // Backend menyertakan nama role lewat klaim `swaportal_role_name` (selain
  // `swaportal_role_id`) — lihat contoh respons /auth/login terbaru.
  const roleLabel = asString(user?.swaportal_role_name) ?? asString(user?.role);
  const roleId = asString(user?.swaportal_role_id);
  const avatarColorClassName = getRoleAvatarColor(roleId);

  return { name, email, avatar, initials, roleLabel, avatarColorClassName };
}
