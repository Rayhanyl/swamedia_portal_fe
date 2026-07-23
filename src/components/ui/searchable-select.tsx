"use client";

import { SearchIcon } from "lucide-react";

import {
  Combobox,
  ComboboxClear,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxPositioner,
  ComboboxPortal,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption<T extends string | number> {
  value: T;
  label: string;
}

// Pengganti drop-in untuk `<select>` native, dipakai konsisten di semua
// form picker di aplikasi (Customer, Karyawan, Unit, enum status, dst) —
// dibangun di atas @base-ui/react/combobox (sudah ter-install, filtering
// bawaan lewat prop `items`, tidak perlu library tambahan).
export function SearchableSelect<T extends string | number>({
  value,
  onValueChange,
  options,
  placeholder = "Pilih...",
  emptyText = "Tidak ditemukan",
  disabled,
  className,
}: {
  value: T | null;
  onValueChange: (value: T | null) => void;
  options: SearchableSelectOption<T>[];
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
}) {
  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <Combobox
      items={options}
      value={selected}
      onValueChange={(item) => onValueChange(item ? item.value : null)}
      disabled={disabled}
    >
      <ComboboxInputGroup className={cn(className)}>
        <SearchIcon className="text-muted-foreground size-3.5 shrink-0" />
        <ComboboxInput placeholder={placeholder} />
        <ComboboxClear />
        <ComboboxTrigger />
      </ComboboxInputGroup>
      <ComboboxPortal>
        <ComboboxPositioner>
          <ComboboxPopup>
            <ComboboxEmpty>{emptyText}</ComboboxEmpty>
            <ComboboxList>
              {(item: SearchableSelectOption<T>) => (
                <ComboboxItem key={item.value} value={item}>
                  {item.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxPopup>
        </ComboboxPositioner>
      </ComboboxPortal>
    </Combobox>
  );
}
