import { ArrowUpRight } from "lucide-react";
import type { Category } from "@/types/product";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/SectionHeading";

/**
 * Bento grid — 3 rows, 7 cards (2 · 3 · 2).
 * Every image is full-bleed with text overlaid at the bottom.
 */

const ROW_CFG: { indices: number[]; lg: string }[] = [
  { indices: [0, 1], lg: "lg:col-span-3" },
  { indices: [2, 3, 4], lg: "lg:col-span-2" },
  { indices: [5, 6], lg: "lg:col-span-3" },
];

const indexToLg = new Map<number, string>();
ROW_CFG.forEach((r) => r.indices.forEach((i) => indexToLg.set(i, r.lg)));

/* Row heights: top & bottom rows taller, middle row slightly shorter */
const ROW_H: Record<number, string> = {
  0: "h-[320px] sm:h-[420px]",
  1: "h-[320px] sm:h-[420px]",
  2: "h-[280px] sm:h-[340px]",
  3: "h-[280px] sm:h-[340px]",
  4: "h-[280px] sm:h-[340px]",
  5: "h-[320px] sm:h-[420px]",
  6: "h-[320px] sm:h-[420px]",
};

export function CategoryBento({ categories }: { categories: Category[] }) {
  const items = categories.filter((category) => category.isActive).slice(0, 7);

  return (
    <section
      id="collections"
      aria-labelledby="collections-heading"
      className="scroll-mt-28 px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-6xl space-y-14">
        <SectionHeading
          id="collections-heading"
          eyebrow="Shop by room"
          title={
            <>
              Curated spaces,
              <br />
              <em className="italic text-clay">one quiet language.</em>
            </>
          }
          copy="Begin where you spend the most time. Each collection is edited the same way — a few pieces, chosen to sit beside one another without effort."
          action={
            <a
              href="#featured"
              className="group inline-flex items-center gap-2 text-[13px] text-foreground/70 transition-colors hover:text-foreground"
            >
              View all pieces
              <ArrowUpRight
                className="size-4 transition-transform duration-500 ease-luxe group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                strokeWidth={1.25}
              />
            </a>
          }
        />

        {/* ── Bento grid ── */}
        <div className="grid grid-cols-1 gap-[6px] sm:grid-cols-2 lg:grid-cols-6">
          {items.map((category, index) => (
            <Reveal
              key={category.id}
              delay={index * 90}
              className={`sm:col-span-1 ${indexToLg.get(index)}`}
            >
              <a
                href={`/shop?category=${encodeURIComponent(category.name)}`}
                className={`group relative block overflow-hidden rounded-[20px] ${ROW_H[index]}`}
              >
                {/* ── Full-bleed image ── */}
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    loading={index < 2 ? "eager" : "lazy"}
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-luxe group-hover:scale-[1.06]"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-clay/40 via-muted to-foreground/30" />
                )}

                {/* ── Gradient overlay — bottom-heavy for text legibility ── */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 via-40% to-transparent" />

                {/* ── Number pill ── */}
                <span className="absolute left-5 top-5 z-10 flex size-9 items-center justify-center rounded-full bg-white/10 text-[11px] font-medium tracking-wide text-white/80 ring-1 ring-white/15 backdrop-blur-md transition-all duration-500 group-hover:bg-white/20 group-hover:ring-white/30">
                  {String(index + 1).padStart(2, "0")}
                </span>

                {/* ── Text overlay ── */}
                <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-4 p-6">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/50">
                      {String(index + 1).padStart(2, "0")} · {category.name}
                    </p>
                    <h3 className="font-serif text-[22px] leading-[1.1] tracking-tight text-white sm:text-[26px]">
                      {category.name}
                    </h3>
                    <p className="max-w-[28ch] text-[12px] leading-[1.55] text-white/55">
                      {category.description}
                    </p>
                  </div>

                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-white backdrop-blur-sm transition-all duration-500 ease-luxe group-hover:border-white/50 group-hover:bg-white/15 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                    <ArrowUpRight className="size-4 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.5} />
                  </span>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
