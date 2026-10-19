import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { Product } from "@/types/product";
import { SafeImage } from "@/components/motion/SafeImage";
import { Nav } from "@/features/landing/Nav";
import { Footer } from "@/features/landing/Footer";
import { CartDrawer } from "@/features/landing/CartDrawer";
import { WishlistDrawer } from "@/features/landing/WishlistDrawer";

const principles = [
  ["Made to stay", "We choose forms and materials that feel more at home with time, not less."],
  ["Useful, beautifully", "Every piece has a purpose. The beauty is in how naturally it earns its place."],
  ["Less, considered", "We edit carefully, offering fewer objects with room to mean more."],
];

export function AboutPage({ products }: { products: Product[] }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <div aria-hidden="true" className="grain-texture pointer-events-none fixed inset-0 z-[65] opacity-[0.025] mix-blend-multiply" />
      <Nav onSearch={() => { window.location.href = "/shop"; }} onCart={() => setCartOpen(true)} onWishlist={() => setWishlistOpen(true)} />
      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-5 pt-14 pb-20 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:items-end lg:px-8">
          <div className="max-w-xl lg:pb-10">
            <p className="eyebrow text-clay">About Lumina</p>
            <h1 className="mt-4 font-serif text-5xl leading-[.95] tracking-tight sm:text-6xl">A quieter way to live with things.</h1>
            <p className="mt-7 text-base leading-8 text-muted-foreground">Lumina is an edit of enduring objects for the rooms that hold your everyday life. We believe a home is made slowly—through useful pieces, honest materials, and the rituals that gather around them.</p>
          </div>
          <div className="aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-muted">
            <SafeImage eager src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1500&q=85" alt="A calm, warmly furnished living room" />
          </div>
        </section>

        <section className="border-y border-border/70 bg-muted/35 px-5 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <p className="eyebrow text-clay">Our point of view</p>
            <div className="mt-6 grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
              <h2 className="font-serif text-4xl leading-tight tracking-tight sm:text-5xl">Objects with a life beyond the first impression.</h2>
              <div className="space-y-5 text-sm leading-7 text-muted-foreground">
                <p>We look for the warmth of natural grain, the irregularity of a hand-finished surface, and the details that make a familiar object feel considered. Our collection is intentionally small so every piece can be chosen with care.</p>
                <p>From makers and workshops we trust to materials that age gracefully, each decision is guided by a simple question: will this still feel right in the years ahead?</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {principles.map(([title, copy], index) => (
              <article key={title} className="rounded-[1.5rem] border border-border/70 bg-card p-6 sm:p-7">
                <span className="eyebrow text-clay">0{index + 1}</span>
                <h2 className="mt-7 font-serif text-3xl tracking-tight">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-20 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-muted">
            <SafeImage src="https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=1200&q=85" alt="Crafted ceramic vessels" />
          </div>
          <div className="flex flex-col justify-center">
            <p className="eyebrow text-clay">A lasting edit</p>
            <h2 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">Choose fewer things. Choose them well.</h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground">We are drawn to pieces that can move with you, collect a little history, and become part of a home rather than simply filling it.</p>
            <a href="/shop" className="mt-7 inline-flex w-fit items-center gap-2 text-sm underline underline-offset-4">Explore the collection <ArrowUpRight className="size-4" /></a>
          </div>
        </section>
      </main>
      <Footer />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} products={products} />
      <WishlistDrawer open={wishlistOpen} onClose={() => setWishlistOpen(false)} products={products} />
    </div>
  );
}
