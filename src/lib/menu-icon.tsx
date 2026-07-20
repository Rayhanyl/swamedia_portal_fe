import * as icons from "lucide-react";
import { CircleIcon } from "lucide-react";
import type { ComponentType } from "react";

type IconComponent = ComponentType<{ className?: string }>;

// Backend mengirim identifier ikon kebab-case (mis. "layout-dashboard"),
// dipetakan ke komponen lucide-react "PascalCaseIcon" (mis.
// LayoutDashboardIcon). Fallback ke CircleIcon bila identifier tidak
// dikenal atau null, supaya menu tetap tampil alih-alih patah.
export function resolveMenuIcon(icon: string | null): IconComponent {
  if (!icon) return CircleIcon;

  const name = `${icon
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")}Icon`;

  const iconMap = icons as unknown as Record<string, IconComponent>;
  return iconMap[name] ?? CircleIcon;
}
