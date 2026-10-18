import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Pill CTA with the trailing icon nested in its own circle — the "button in a
 * button" pattern. Two tones: ink (primary) and outline (secondary).
 */
export function ArrowButton({
  children,
  href,
  onClick,
  variant = "ink",
  className,
  type = "button",
  disabled,
  ariaLabel,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "ink" | "outline" | "clay";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const tones = {
    ink: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline:
      "border border-foreground/15 bg-transparent text-foreground hover:border-foreground/30 hover:bg-foreground/[0.03]",
    clay: "bg-clay text-background hover:bg-clay/90",
  } as const;

  const content = (
    <>
      <span className="pl-2">{children}</span>
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-full transition-transform duration-500 ease-luxe group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105",
          variant === "outline" ? "bg-foreground/[0.06]" : "bg-background/15",
        )}
      >
        <ArrowUpRight className="size-3.5" strokeWidth={1.25} />
      </span>
    </>
  );

  const shared = cn(
    "group inline-flex h-11 items-center gap-3 rounded-full pr-1.5 pl-5 text-[13px] font-medium tracking-tight transition-[background-color,border-color,transform] duration-500 ease-luxe active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
    tones[variant],
    className,
  );

  if (href) {
    return (
      <a href={href} className={shared} aria-label={ariaLabel}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={shared}
    >
      {content}
    </button>
  );
}
