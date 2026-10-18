import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Product } from "@/types/product";
import { SafeImage } from "@/components/motion/SafeImage";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { StarRating } from "@/components/StarRating";
import { formatPrice } from "@/services/api";

export function BestSellers({
  products,
  onQuickView,
}: {
  products: Product[];
  onQuickView: (product: Product) => void;
}) {
  const railRef = useRef<HTMLDivElement | null>(null);

  const scrollBy = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    const amount = Math.min(rail.clientWidth * 0.8, 720);
    rail.scrollBy({ left: amount * direction, behavior: "smooth" });
  };

  return (
    <section
      aria-labelledby="bestsellers-heading"
      className="border-y border-border/60 bg-card/40 py-16 lg:py-20"
    >
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="flex items-end justify-between px-4 md:px-6 lg:px-0">
          <SectionHeading
            id="bestsellers-heading"
            eyebrow="Most loved"
            title={
              <>
                What keeps{" "}
                <em className="italic text-clay">returning.</em>
              </>
            }
            className="flex-1"
          />

          <div className="hidden shrink-0 gap-2 md:flex">
            {[
              { label: "Scroll left", icon: ArrowLeft, dir: -1 as const },
              { label: "Scroll right", icon: ArrowRight, dir: 1 as const },
            ].map(({ label, icon: Icon, dir }) => (
              <button
                key={label}
                type="button"
                onClick={() => scrollBy(dir)}
                aria-label={label}
                className="flex size-11 items-center justify-center rounded-full border border-border transition-colors duration-500 ease-luxe hover:border-foreground/30 hover:bg-foreground/[0.03]"
              >
                <Icon className="size-4" strokeWidth={1.25} />
              </button>
            ))}
          </div>
        </div>

        <div
          ref={railRef}
          className="scrollbar-none flex snap-x snap-mandatory gap-5 overflow-x-auto mx-4 px-4 pb-2 sm:px-6 lg:px-8 lg:mx-0"
        >
          {products.map((product, index) => (
            <Reveal
              key={product.id}
              delay={index * 60}
              className="w-[78vw] max-w-[320px] shrink-0 snap-start sm:w-[42vw] lg:w-[300px]"
            >
              <button
                type="button"
                onClick={() => onQuickView(product)}
                className="group block w-full text-left"
              >
                <div className="aspect-[3/4] overflow-hidden rounded-[1.5rem] bg-muted">
                  <SafeImage
                    src={product.images[0]}
                    alt={product.name}
                    className="transition-transform duration-[1200ms] ease-luxe group-hover:scale-[1.045]"
                  />
                </div>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow text-muted-foreground">{product.category}</p>
                    <h3 className="mt-1.5 font-serif text-xl leading-tight">
                      {product.name}
                    </h3>
                    <StarRating rating={product.rating} count={product.reviewCount} showCount className="mt-2" />
                  </div>
                  <span className="tabular pt-0.5 text-[13px] font-medium">
                    {formatPrice(product.price)}
                  </span>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
