import * as React from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

function RadioGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root data-slot="radio-group" className={cn("grid gap-2", className)} {...props} />;
}

function RadioGroupItem({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return <RadioGroupPrimitive.Item data-slot="radio-group-item" className={cn("aspect-square size-5 shrink-0 rounded-full border border-muted-foreground/70 bg-card text-clay outline-none transition-colors hover:border-foreground/60 focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/20 data-[state=checked]:border-clay disabled:cursor-not-allowed disabled:opacity-50", className)} {...props}><RadioGroupPrimitive.Indicator className="relative flex size-full items-center justify-center after:size-2.5 after:rounded-full after:bg-current" /></RadioGroupPrimitive.Item>;
}

export { RadioGroup, RadioGroupItem };
