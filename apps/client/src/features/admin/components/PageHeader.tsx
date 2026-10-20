import type { ReactNode } from "react";
export function PageHeader({
  eyebrow = "Lumina administration",
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="eyebrow text-clay">{eyebrow}</p>
        <h1 className="mt-2 text-4xl leading-none md:text-5xl">{title}</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
