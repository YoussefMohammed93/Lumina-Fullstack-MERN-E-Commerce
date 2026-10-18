import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface SectionHeadingProps {
  eyebrow: string;
  title: ReactNode;
  copy?: string;
  align?: "left" | "center";
  action?: ReactNode;
  className?: string;
  id?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  copy,
  align = "left",
  action,
  className,
  id,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 md:flex-row md:items-end md:justify-between",
        align === "center" && "md:flex-col md:items-center md:text-center",
        className,
      )}
    >
      <div
        className={cn(
          "max-w-2xl space-y-5",
          align === "center" && "mx-auto text-center",
        )}
      >
        <p className="eyebrow text-clay">{eyebrow}</p>
        <h2 id={id} className="display-section text-balance">
          {title}
        </h2>
        {copy && (
          <p className="max-w-prose text-[15px] leading-7 text-muted-foreground">
            {copy}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
