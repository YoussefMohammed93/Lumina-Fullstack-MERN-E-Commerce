import { ArrowUpRight } from "lucide-react";
import { SafeImage } from "@/components/motion/SafeImage";
import { Reveal } from "@/components/motion/Reveal";

const PRINCIPLES = [
  {
    number: "01",
    title: "Materials",
    copy: "Solid oak, undyed wool, unglazed clay. Surfaces we can leave unfinished because they only improve with use.",
  },
  {
    number: "02",
    title: "Form",
    copy: "Proportion before decoration. A piece earns its place by how it sits in the room, not by how it photographs.",
  },
  {
    number: "03",
    title: "Permanence",
    copy: "We would rather sell you one chair than three. Every object is repairable, and every workshop is named.",
  },
];

export function EditorialFeature() {
  return (
    <section
      id="journal"
      aria-labelledby="journal-heading"
      className="scroll-mt-28 overflow-hidden px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <Reveal className="order-2 lg:order-1">
          <div className="space-y-8">
            <p className="eyebrow flex items-center gap-3 text-clay">
              <span className="h-px w-8 bg-clay/50" />
              Journal · Vol. 02
            </p>

            <h2 id="journal-heading" className="display-section text-balance">
              The makings of a{" "}
              <em className="italic text-clay">quiet room.</em>
            </h2>

            <p className="max-w-prose text-[15px] leading-7 text-muted-foreground">
              A room does not become calm by accident. It is the result of
              fewer objects, better materials, and light that is allowed to
              move slowly. These are the three decisions we return to with
              every maker we work alongside.
            </p>

            <ol className="divide-y divide-border/70 border-y border-border/70">
              {PRINCIPLES.map((principle) => (
                <li key={principle.number} className="grid grid-cols-[3rem_1fr] gap-4 py-5">
                  <span className="tabular pt-1 text-[11px] text-clay">
                    {principle.number}
                  </span>
                  <div className="space-y-1.5">
                    <h3 className="font-serif text-xl tracking-tight">
                      {principle.title}
                    </h3>
                    <p className="text-[13px] leading-6 text-muted-foreground">
                      {principle.copy}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <a
              href="#newsletter"
              className="group inline-flex items-center gap-2 text-[13px] font-medium text-foreground"
            >
              Keep reading in the journal
              <ArrowUpRight
                className="size-4 text-clay transition-transform duration-500 ease-luxe group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                strokeWidth={1.25}
              />
            </a>
          </div>
        </Reveal>

        <Reveal delay={120} className="order-1 lg:order-2">
          <div className="relative">
            <div className="rounded-[2.5rem] bg-foreground/[0.05] p-2 ring-1 ring-foreground/8">
              <div className="aspect-[4/5] overflow-hidden rounded-[calc(2.5rem-0.5rem)] bg-muted">
                <SafeImage
                  src="https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=1200&q=80"
                  alt="A quiet interior with natural materials and soft daylight"
                />
              </div>
            </div>

            <div className="absolute -bottom-6 -left-4 max-w-[15rem] rounded-[1.4rem] bg-foreground p-5 text-background shadow-[0_30px_60px_-30px_rgba(26,24,21,0.6)] sm:-left-8">
              <p className="eyebrow text-background/50">Note from the studio</p>
              <p className="mt-2.5 font-serif text-lg leading-snug">
                “Buy once, keep it forever.”
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
