import { useState } from "react";
import { ArrowRight, Clock, Mail, MapPin } from "lucide-react";
import type { Product } from "@/types/product";
import { Nav } from "@/features/landing/Nav";
import { Footer } from "@/features/landing/Footer";
import { CartDrawer } from "@/features/landing/CartDrawer";
import { WishlistDrawer } from "@/features/landing/WishlistDrawer";

type InfoPageKey = "shipping" | "care" | "faq" | "privacy" | "terms";

const PAGES: Record<
  InfoPageKey,
  {
    eyebrow: string;
    title: string;
    intro: string;
    sections: Array<[string, string]>;
  }
> = {
  shipping: {
    eyebrow: "Shipping & returns",
    title: "Thoughtful delivery, uncomplicated returns.",
    intro:
      "We pack every order with care and aim to make receiving—or returning—your piece feel simple.",
    sections: [
      [
        "Delivery",
        "Orders are prepared within 1–2 business days. Once dispatched, delivery timing depends on your destination and the carrier selected at checkout.",
      ],
      [
        "Returns",
        "If something is not right, contact us within 14 days of delivery. Items should be unused, in their original condition, and returned with their original packaging.",
      ],
      [
        "A little help",
        "For delivery updates, damaged items, or a return request, email us with your order number and we will help as quickly as possible.",
      ],
    ],
  },
  care: {
    eyebrow: "Care guide",
    title: "Made to be lived with—and looked after.",
    intro:
      "Natural materials become more personal with time. A few gentle habits will help your pieces age beautifully.",
    sections: [
      [
        "Wood & natural finishes",
        "Dust with a soft, dry cloth and wipe spills promptly. Avoid prolonged direct sun, standing water, and harsh household cleaners.",
      ],
      [
        "Ceramics & glass",
        "Wash by hand when possible and avoid sudden temperature changes. Small variations in glaze, tone, and shape are part of the character of handmade work.",
      ],
      [
        "Textiles",
        "Follow the care label on each piece. For everyday care, air textiles between uses and treat stains gently rather than rubbing them in.",
      ],
    ],
  },
  faq: {
    eyebrow: "Frequently asked questions",
    title: "A few useful answers.",
    intro:
      "If you cannot find what you need here, our support team is happy to help.",
    sections: [
      [
        "When will my order arrive?",
        "Orders are prepared within 1–2 business days. Delivery timing is confirmed by your carrier once your order is dispatched.",
      ],
      [
        "Can I return an item?",
        "Yes. Contact us within 14 days of delivery and return the unused item in its original condition and packaging.",
      ],
      [
        "Are products exactly as pictured?",
        "We work with natural and handmade materials, so small variations in colour, grain, glaze, and finish are expected and make each piece unique.",
      ],
      [
        "How can I get help with an order?",
        "Email lumina@gmail.com with your order number. We are available every day from 8 am to 2 pm.",
      ],
    ],
  },
  privacy: {
    eyebrow: "Privacy",
    title: "Your information, handled with care.",
    intro:
      "We collect only the information needed to run the store, fulfil your order, and support you.",
    sections: [
      [
        "What we collect",
        "When you shop or contact us, we may collect details such as your name, email address, delivery information, and order history.",
      ],
      [
        "How we use it",
        "We use this information to process orders, communicate about your purchase, provide support, and improve the store experience.",
      ],
      [
        "Your choices",
        "You can ask us to update or delete personal information we hold about you by emailing lumina@gmail.com.",
      ],
    ],
  },
  terms: {
    eyebrow: "Terms of use",
    title: "The simple terms of shopping with Lumina.",
    intro: "By using our store or placing an order, you agree to these terms.",
    sections: [
      [
        "Orders & availability",
        "We aim to keep product information and stock availability accurate. If an item cannot be fulfilled, we will contact you and arrange a refund or an alternative.",
      ],
      [
        "Prices & payment",
        "Prices and available payment methods are shown at checkout. We may update prices or product information when needed.",
      ],
      [
        "Our content",
        "The Lumina name, product photography, copy, and design belong to Lumina unless otherwise stated and may not be reused without permission.",
      ],
    ],
  },
};

export function InfoPage({
  page,
  products,
}: {
  page: InfoPageKey;
  products: Product[];
}) {
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const content = PAGES[page];

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <div
        aria-hidden="true"
        className="grain-texture pointer-events-none fixed inset-0 z-[65] opacity-[0.025] mix-blend-multiply"
      />
      <Nav
        onSearch={() => {
          window.location.href = "/shop";
        }}
        onCart={() => setCartOpen(true)}
        onWishlist={() => setWishlistOpen(true)}
        products={products}
      />
      <main className="mx-auto max-w-4xl px-5 pt-14 pb-20 sm:px-6 lg:px-8">
        <header className="max-w-3xl border-b border-border/70 pb-12">
          <p className="eyebrow text-clay">{content.eyebrow}</p>
          <h1 className="mt-4 font-serif text-5xl leading-[.95] tracking-tight sm:text-6xl">
            {content.title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground">
            {content.intro}
          </p>
        </header>
        <div className="divide-y divide-border/70">
          {content.sections.map(([title, copy], index) => (
            <section
              key={title}
              className="grid gap-4 py-9 sm:grid-cols-[10rem_1fr] sm:gap-8"
            >
              <p className="eyebrow text-clay">0{index + 1}</p>
              <div>
                <h2 className="font-serif text-2xl tracking-tight">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {copy}
                </p>
              </div>
            </section>
          ))}
        </div>
        <section className="mt-8 rounded-[1.5rem] bg-muted/55 p-6 sm:p-8">
          <p className="eyebrow text-clay">Need a hand?</p>
          <div className="mt-5 grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
            <a
              href="mailto:lumina@gmail.com"
              className="flex items-center gap-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
            >
              <Mail className="size-4" />
              lumina@gmail.com
            </a>
            <span className="flex items-center gap-2">
              <MapPin className="size-4" />
              Mansoura, Egypt
            </span>
            <span className="flex items-center gap-2">
              <Clock className="size-4" />
              Daily, 8 am–2 pm
            </span>
          </div>
          <a
            href="mailto:lumina@gmail.com"
            className="mt-6 inline-flex items-center gap-2 text-sm underline underline-offset-4 transition-colors hover:text-clay"
          >
            Contact support <ArrowRight className="size-4" />
          </a>
        </section>
      </main>
      <Footer />
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        products={products}
      />
      <WishlistDrawer
        open={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        products={products}
      />
    </div>
  );
}
