import { ArrowUpRight, Hammer, RotateCcw, Truck } from "lucide-react";
import type { Product } from "@/types/product";
import { SafeImage } from "@/components/motion/SafeImage";
import { ArrowButton } from "@/components/ArrowButton";
import { Reveal } from "@/components/motion/Reveal";

export function Hero({
  featured,
  onImagesSettled,
}: {
  featured: Product;
  onImagesSettled?: () => void;
}) {
  return (
    <section
      id="top"
      className="relative overflow-hidden px-4 pt-10 pb-16 sm:px-6 lg:px-8 lg:pb-28"
    >
      {/* Soft tonal wash behind the composition */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] bg-[radial-gradient(80%_60%_at_75%_10%,rgba(180,101,63,0.10),transparent_70%)]"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div className="max-w-xl space-y-8 pb-2 lg:pb-10">
          <Reveal delay={90}>
            <h1 className="display-hero text-balance">
              Objects for
              <br />
              considered{" "}
              <em className="font-normal text-clay italic">living.</em>
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="max-w-md text-[15px] leading-7 text-muted-foreground">
              Furniture, ceramics and light made by small workshops and chosen
              for how they age. Nothing loud — only pieces you will still want
              in ten years.
            </p>
          </Reveal>

          <Reveal delay={260}>
            <div className="flex flex-wrap items-center gap-4">
              <ArrowButton href="#featured">Explore the collection</ArrowButton>
              <a
                href="#journal"
                className="group inline-flex items-center gap-1.5 text-[13px] text-foreground/70 transition-colors duration-300 hover:text-foreground"
              >
                Read our philosophy
                <ArrowUpRight
                  className="size-3.5 transition-transform duration-500 ease-luxe group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  strokeWidth={1.25}
                />
              </a>
            </div>
          </Reveal>

          <Reveal delay={340}>
            <dl className="grid max-w-sm grid-cols-3 gap-4 border-t border-border/70 pt-6">
              {[
                { value: "Small-batch", label: "Makers", icon: Hammer },
                { value: "Ships in", label: "48 hours", icon: Truck },
                { value: "30-day", label: "Returns", icon: RotateCcw },
              ].map(({ value, label, icon: Icon }) => (
                <div key={value}>
                  <dt className="flex flex-col gap-2 text-[13px] font-medium">
                    <span className="flex size-7 sm:size-12 items-center justify-center rounded-full bg-secondary text-clay">
                      <Icon className="size-4 sm:size-6" strokeWidth={1.35} />
                    </span>
                    {value}
                  </dt>
                  <dd className="mt-0.5 text-[11px] text-muted-foreground">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        {/* Asymmetric image composition */}
        <div className="relative">
          <Reveal delay={120}>
            <div className="rounded-[2.25rem] bg-foreground/[0.05] p-2 ring-1 ring-foreground/8">
              <div className="relative aspect-[4/5] md:aspect-square overflow-hidden rounded-[calc(2.25rem-0.5rem)] bg-muted">
                <SafeImage
                  src="/hero.webp"
                  alt="Warm, thoughtfully furnished living room"
                  eager
                  onSettled={onImagesSettled}
                  className="transition-transform duration-[1400ms] ease-luxe hover:scale-[1.03]"
                />
              </div>
            </div>
          </Reveal>

          {/* Overlapping detail card */}
          <Reveal
            delay={260}
            className="absolute -bottom-8 -left-4 w-36 sm:-left-8 sm:w-44"
          >
            <figure className="-rotate-2 rounded-[1.4rem] bg-card p-1.5 shadow-[0_28px_50px_-30px_rgba(26,24,21,0.45)] ring-1 ring-foreground/8">
              <div className="aspect-square overflow-hidden rounded-[1rem]">
                <SafeImage
                  src={featured.images[1] ?? featured.images[0]}
                  alt={`${featured.name} detail`}
                  eager
                  onSettled={onImagesSettled}
                />
              </div>
              <figcaption className="flex items-center justify-between px-2.5 py-2">
                <span className="eyebrow text-muted-foreground">Detail</span>
                <span className="eyebrow text-clay">
                  <ArrowUpRight className="size-3" strokeWidth={1.5} />  
                </span>
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
