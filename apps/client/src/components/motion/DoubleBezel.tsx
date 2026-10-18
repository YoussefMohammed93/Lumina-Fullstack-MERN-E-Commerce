import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Double-bezel frame: an outer tray with a hairline and inset padding cradling
 * an inner surface with its own tone. Everything that should read as a "made
 * object" — imagery, cards, panels — sits inside one of these.
 */
export function DoubleBezel({
  children,
  className,
  innerClassName,
  tone = "light",
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  tone?: "light" | "ink";
}) {
  return (
    <div
      className={cn(
        "rounded-[2rem] p-1.5 ring-1 ring-foreground/8",
        tone === "light"
          ? "bg-foreground/[0.04] shadow-[0_30px_60px_-40px_rgba(26,24,21,0.35)]"
          : "bg-foreground/90 ring-foreground/20",
        className,
      )}
    >
      <div
        className={cn(
          "relative h-full overflow-hidden rounded-[calc(2rem-0.375rem)]",
          tone === "light"
            ? "bg-card shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
            : "bg-foreground",
          innerClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
