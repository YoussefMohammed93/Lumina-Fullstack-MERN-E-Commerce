import { useState } from "react";
import type { Category, Product } from "@/types/product";
import { ProductCard } from "./ProductCard";
import { ArrowButton } from "@/components/ArrowButton";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { cn } from "@/lib/utils";

export function FeaturedEdit({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const [active, setActive] = useState<string>("All");

  const visible =
    active === "All"
      ? products.slice(0, 8)
      : products.filter((product) => product.category === active).slice(0, 8);

  return (
    <section
      id="featured"
      aria-labelledby="featured-heading"
      className="scroll-mt-28 border-t border-border/60 bg-card/40 px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
    >
      <div className="mx-auto max-w-6xl space-y-12">
        <SectionHeading
          id="featured-heading"
          eyebrow="The collection"
          title={
            <>
              The autumn edit —{" "}
              <em className="italic text-clay">twelve pieces.</em>
            </>
          }
          copy="A short list, refreshed each season. Everything is in stock, photographed in daylight, and shipped by the workshops that made it."
        />

        <div
          role="tablist"
          aria-label="Filter products by category"
          className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
        >
          {["All", ...categories.filter((item) => item.isActive).map((item) => item.name)].map((category) => {
            const isActive = active === category;
            return (
              <button
                key={category}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(category)}
                className={cn(
                  "h-9 shrink-0 rounded-full border px-4 text-[12px] transition-all duration-500 ease-luxe",
                  isActive
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-transparent text-foreground/65 hover:border-foreground/30 hover:text-foreground",
                )}
              >
                {category}
                <span
                  className={cn(
                    "ml-2 tabular text-[10px]",
                    isActive ? "text-background/60" : "text-muted-foreground",
                  )}
                >
                  {category === "All"
                    ? products.length
                    : products.filter(
                        (product) => product.category === category,
                      ).length}
                </span>
              </button>
            );
          })}
        </div>

        <div
          key={active}
          className="grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4"
        >
          {visible.map((product, index) => (
            <Reveal key={product.id} delay={index * 60}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>

        <div className="flex justify-center">
          <ArrowButton href="/shop">Discover all products</ArrowButton>
        </div>
      </div>
    </section>
  );
}
