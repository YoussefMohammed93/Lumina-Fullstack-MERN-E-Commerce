import { useState, type FormEvent } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = email.trim();

    if (!value) {
      setError("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setError("That address doesn’t look quite right.");
      return;
    }

    setError(null);
    setSubscribed(true);
  };

  return (
    <section
      id="newsletter"
      aria-labelledby="newsletter-heading"
      className="scroll-mt-28 px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
    >
      <Reveal>
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-muted px-6 py-16 ring-1 ring-foreground/8 sm:px-12 lg:py-20">
          <div className="mx-auto max-w-xl space-y-6 text-center">
            <p className="eyebrow text-clay">The journal, by post</p>
            <h2 id="newsletter-heading" className="display-section text-balance">
              Notes on living well,{" "}
              <em className="italic text-clay">once a month.</em>
            </h2>
            <p className="mx-auto max-w-md text-[14px] leading-7 text-muted-foreground">
              New pieces, workshop visits and the occasional essay on making
              things that last. No noise, and you can leave whenever you like.
            </p>

            {subscribed ? (
              <div
                role="status"
                className="mx-auto flex max-w-sm items-center justify-center gap-3 rounded-full bg-background px-5 py-3 text-[13px] text-foreground ring-1 ring-border"
              >
                <span className="flex size-6 items-center justify-center rounded-full bg-clay text-background">
                  <Check className="size-3.5" strokeWidth={2} />
                </span>
                You’re on the list. Welcome.
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row sm:items-center sm:gap-2 sm:rounded-full sm:bg-background sm:p-1.5 sm:ring-1 sm:ring-border"
              >
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="your@email.com"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "newsletter-error" : undefined}
                  className={cn(
                    "h-11 py-3 flex-1 rounded-full border border-border bg-background px-5 text-[13px] outline-none transition-colors placeholder:text-muted-foreground/70 sm:border-transparent sm:bg-transparent",
                    error && "border-destructive/60",
                  )}
                />
                <button
                  type="submit"
                  className="group inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary pr-1.5 pl-5 text-[13px] font-medium text-primary-foreground transition-[background-color,transform] duration-500 ease-luxe hover:bg-primary/90 active:scale-[0.98]"
                >
                  Subscribe
                  <span className="flex size-8 items-center justify-center rounded-full bg-background/15 transition-transform duration-500 ease-luxe group-hover:translate-x-0.5">
                    <ArrowRight className="size-3.5" strokeWidth={1.5} />
                  </span>
                </button>
              </form>
            )}

            {error && (
              <p id="newsletter-error" role="alert" className="text-[12px] text-destructive">
                {error}
              </p>
            )}

            <p className="text-[10px] leading-5 text-muted-foreground/80">
              By subscribing you agree to our privacy policy. One email a month,
              never shared.
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
