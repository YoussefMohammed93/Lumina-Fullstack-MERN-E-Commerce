import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  count,
  className,
  showCount = false,
}: {
  rating: number;
  count?: number;
  className?: string;
  showCount?: boolean;
}) {
  const rounded = Math.round(rating);

  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      aria-label={`Rated ${rating} out of 5`}
    >
      <span className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            strokeWidth={1}
            className={cn(
              "size-3",
              index < rounded
                ? "fill-clay/80 text-clay"
                : "fill-transparent text-foreground/25",
            )}
          />
        ))}
      </span>
      {showCount && count !== undefined && (
        <span className="tabular text-[11px] text-muted-foreground">
          {count}
        </span>
      )}
    </span>
  );
}
