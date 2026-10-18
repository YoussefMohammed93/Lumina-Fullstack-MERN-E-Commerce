import * as React from "react";
import { Check } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return <CheckboxPrimitive.Root data-slot="checkbox" className={cn("peer size-5 shrink-0 rounded-[4px] border border-muted-foreground/70 bg-card outline-none transition-colors hover:border-foreground/60 focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/20 data-[state=checked]:border-clay data-[state=checked]:bg-clay data-[state=checked]:text-background disabled:cursor-not-allowed disabled:opacity-50", className)} {...props}><CheckboxPrimitive.Indicator className="flex items-center justify-center text-current"><Check className="size-3.5" strokeWidth={2} /></CheckboxPrimitive.Indicator></CheckboxPrimitive.Root>;
}

export { Checkbox };
