"use client";

import { Fragment } from "react";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { MenuItem } from "@/types/menu";

function findTrail(items: MenuItem[], pathname: string): MenuItem[] | null {
  for (const item of items) {
    if (item.path === pathname) return [item];
    const childTrail = findTrail(item.children, pathname);
    if (childTrail) return [item, ...childTrail];
  }
  return null;
}

export function DashboardBreadcrumb({ menu }: { menu: MenuItem[] }) {
  const pathname = usePathname();
  const trail = findTrail(menu, pathname);
  // Elemen pertama trail adalah grup section (mis. "Menu Utama") yang sudah
  // ditampilkan sebagai label section di sidebar, jadi tidak diulang di sini
  // — kecuali trail-nya cuma grup itu sendiri (grup tanpa children/leaf).
  const crumbs = trail && trail.length > 1 ? trail.slice(1) : trail;

  if (!crumbs || crumbs.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((item, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <Fragment key={item.id}>
              <BreadcrumbItem
                className={isLast ? undefined : "hidden md:block"}
              >
                {isLast ? (
                  <BreadcrumbPage>{item.namaMenu}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={item.path ?? "#"}>
                    {item.namaMenu}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
