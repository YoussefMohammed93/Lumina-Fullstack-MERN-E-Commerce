import type { Testimonial } from "@/types/product";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { StarRating } from "@/components/StarRating";

export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  return (
    <section
      aria-labelledby="testimonials-heading"
      className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
    >
      <div className="mx-auto max-w-6xl space-y-14">
        <SectionHeading
          id="testimonials-heading"
          eyebrow="In their words"
          title={
            <>
              Quietly{" "}
              <em className="italic text-clay">well received.</em>
            </>
          }
          align="center"
          copy="Notes from people who have lived with these pieces for a season or more."
        />

        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <Reveal key={testimonial.id} delay={index * 100}>
              <figure className="flex h-full flex-col gap-6 border-t border-foreground/15 pt-6">
                <StarRating rating={testimonial.rating} />
                <blockquote className="display-quote flex-1 text-balance">
                  “{testimonial.quote}”
                </blockquote>
                <figcaption className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {testimonial.avatar ? (
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="size-11 rounded-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-clay/30 to-clay/10 text-[13px] font-medium text-foreground/60">
                        {testimonial.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    )}
                    <div>
                      <p className="text-[13px] font-medium">{testimonial.name}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {testimonial.location}
                      </p>
                    </div>
                  </div>
                  <span className="eyebrow text-muted-foreground/70">
                    Verified
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
