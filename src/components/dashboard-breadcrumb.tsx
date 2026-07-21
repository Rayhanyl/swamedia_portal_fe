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
  const crumbs = findTrail(menu, pathname);

  if (!crumbs || crumbs.length === 0) {
    return null;
  }

  const pageTitle = crumbs[crumbs.length - 1].namaMenu;

  return (
    <div className="flex flex-col gap-0.5">
      <Breadcrumb>
        <BreadcrumbList className="gap-1 text-xs">
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
      <h1 className="text-foreground text-lg font-semibold">{pageTitle}</h1>
    </div>
  );
}
