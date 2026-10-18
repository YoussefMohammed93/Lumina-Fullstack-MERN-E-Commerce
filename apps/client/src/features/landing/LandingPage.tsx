import { useState } from "react";
import type { Collection, Product, Testimonial } from "@/types/product";
import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { Marquee } from "./Marquee";
import { CategoryBento } from "./CategoryBento";
import { FeaturedEdit } from "./FeaturedEdit";
import { EditorialFeature } from "./EditorialFeature";
import { BestSellers } from "./BestSellers";
import { Testimonials } from "./Testimonials";
import { Newsletter } from "./Newsletter";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";
import { WishlistDrawer } from "./WishlistDrawer";
import { SearchOverlay } from "./SearchOverlay";
import { QuickView } from "./QuickView";

export function LandingPage({
  products,
  collections,
  testimonials,
}: {
  products: Product[];
  collections: Collection[];
  testimonials: Testimonial[];
}) {
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickView, setQuickView] = useState<Product | null>(null);

  const featured = products[0];
  const bestSellers = [...products]
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 6);

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      {/* Paper grain — fixed, non-interactive, never attached to scroll containers */}
      <div
        aria-hidden="true"
        className="grain-texture pointer-events-none fixed inset-0 z-[65] opacity-[0.035] mix-blend-multiply"
      />

      <a
        href="#featured"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[80] focus:rounded-full focus:bg-foreground focus:px-4 focus:py-2 focus:text-[12px] focus:text-background"
      >
        Skip to the collection
      </a>

      <Nav
        onSearch={() => setSearchOpen(true)}
        onCart={() => setCartOpen(true)}
        onWishlist={() => setWishlistOpen(true)}
      />

      <main>
        <Hero featured={featured} />
        <Marquee />
        <CategoryBento collections={collections} />
        <FeaturedEdit products={products} onQuickView={setQuickView} />
        <EditorialFeature />
        <BestSellers products={bestSellers} onQuickView={setQuickView} />
        <Testimonials testimonials={testimonials} />
        <Newsletter />
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
        onQuickView={setQuickView}
      />
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        products={products}
        onQuickView={setQuickView}
      />
      <QuickView product={quickView} onClose={() => setQuickView(null)} />
    </div>
  );
}
