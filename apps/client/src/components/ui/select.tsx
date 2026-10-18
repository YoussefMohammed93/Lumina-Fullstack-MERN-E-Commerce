import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;

function SelectTrigger({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return <SelectPrimitive.Trigger data-slot="select-trigger" className={cn("flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 text-left text-sm outline-none transition-colors hover:border-foreground/30 focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/20 disabled:cursor-not-allowed disabled:opacity-50", className)} {...props}>{children}<SelectPrimitive.Icon asChild><ChevronDown className="size-4 text-muted-foreground" strokeWidth={1.5} /></SelectPrimitive.Icon></SelectPrimitive.Trigger>;
}

function SelectContent({ className, children, position = "popper", ...props }: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return <SelectPrimitive.Portal><SelectPrimitive.Content data-slot="select-content" position={position} className={cn("z-[70] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-[0_18px_40px_-24px_rgba(26,24,21,0.45)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className)} {...props}><SelectPrimitive.Viewport className="p-0.5">{children}</SelectPrimitive.Viewport></SelectPrimitive.Content></SelectPrimitive.Portal>;
}

function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return <SelectPrimitive.Item data-slot="select-item" className={cn("relative flex h-9 cursor-default select-none items-center rounded-xl py-1 pr-8 pl-3 text-sm outline-none data-[highlighted]:bg-muted data-[state=checked]:text-clay", className)} {...props}><SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText><span className="absolute right-2 flex size-4 items-center justify-center"><SelectPrimitive.ItemIndicator><Check className="size-3.5" /></SelectPrimitive.ItemIndicator></span></SelectPrimitive.Item>;
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
