"use client";

import * as React from "react";
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { CheckIcon, ChevronsUpDownIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function Combobox<Value, Multiple extends boolean | undefined = false>({
  ...props
}: ComboboxPrimitive.Root.Props<Value, Multiple>) {
  return <ComboboxPrimitive.Root data-slot="combobox" {...props} />;
}

function ComboboxInputGroup({
  className,
  ...props
}: ComboboxPrimitive.InputGroup.Props) {
  return (
    <ComboboxPrimitive.InputGroup
      data-slot="combobox-input-group"
      className={cn(
        "border-input focus-within:border-ring focus-within:ring-ring/50 dark:bg-input/30 flex h-8 w-full items-center gap-1.5 rounded-lg border bg-transparent px-2.5 transition-colors focus-within:ring-3 data-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxInput({ className, ...props }: ComboboxPrimitive.Input.Props) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-input"
      className={cn(
        "placeholder:text-muted-foreground w-full min-w-0 bg-transparent text-sm outline-none disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxTrigger({
  className,
  children,
  ...props
}: ComboboxPrimitive.Trigger.Props) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      className={cn(
        "text-muted-foreground hover:text-foreground shrink-0",
        className,
      )}
      {...props}
    >
      {children ?? <ChevronsUpDownIcon className="size-3.5" />}
    </ComboboxPrimitive.Trigger>
  );
}

function ComboboxClear({ className, ...props }: ComboboxPrimitive.Clear.Props) {
  return (
    <ComboboxPrimitive.Clear
      data-slot="combobox-clear"
      className={cn(
        "text-muted-foreground hover:text-foreground hidden shrink-0 items-center justify-center data-visible:flex",
        className,
      )}
      {...props}
    >
      <XIcon className="size-3.5" />
    </ComboboxPrimitive.Clear>
  );
}

function ComboboxPortal(props: ComboboxPrimitive.Portal.Props) {
  return <ComboboxPrimitive.Portal data-slot="combobox-portal" {...props} />;
}

function ComboboxPositioner({
  className,
  sideOffset = 4,
  ...props
}: ComboboxPrimitive.Positioner.Props) {
  return (
    <ComboboxPrimitive.Positioner
      data-slot="combobox-positioner"
      className={cn("isolate z-50 outline-none", className)}
      sideOffset={sideOffset}
      {...props}
    />
  );
}

function ComboboxPopup({ className, ...props }: ComboboxPrimitive.Popup.Props) {
  return (
    <ComboboxPrimitive.Popup
      data-slot="combobox-popup"
      className={cn(
        "bg-popover text-popover-foreground ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 z-50 max-h-(--available-height) w-(--anchor-width) min-w-40 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg p-1 shadow-md ring-1 duration-100 outline-none",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxList(props: ComboboxPrimitive.List.Props) {
  return <ComboboxPrimitive.List data-slot="combobox-list" {...props} />;
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn(
        "text-muted-foreground p-2 text-center text-sm empty:m-0 empty:p-0",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxItem({
  className,
  children,
  ...props
}: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "data-highlighted:bg-accent data-highlighted:text-accent-foreground relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ItemIndicator className="absolute right-2 flex items-center justify-center">
        <CheckIcon className="size-4" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  );
}

export {
  Combobox,
  ComboboxInputGroup,
  ComboboxInput,
  ComboboxTrigger,
  ComboboxClear,
  ComboboxPortal,
  ComboboxPositioner,
  ComboboxPopup,
  ComboboxList,
  ComboboxEmpty,
  ComboboxItem,
};
