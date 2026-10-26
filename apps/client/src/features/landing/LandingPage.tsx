import { useCallback, useEffect, useState } from "react";
import type { Category, Product, Testimonial } from "@/types/product";
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
import { BrandLoadingScreen } from "@/components/BrandLogo";

export function LandingPage({
  products,
  categories,
  testimonials,
}: {
  products: Product[];
  categories: Category[];
  testimonials: Testimonial[];
}) {
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [heroImagesSettled, setHeroImagesSettled] = useState(0);
  const [fontsReady, setFontsReady] = useState(false);
  const [announcementReady, setAnnouncementReady] = useState(false);
  const [footerSettingsReady, setFooterSettingsReady] = useState(false);
  const [preparationTimedOut, setPreparationTimedOut] = useState(false);
  const onHeroImageSettled = useCallback(() => {
    setHeroImagesSettled((count) => Math.min(count + 1, 2));
  }, []);

  const onAnnouncementReady = useCallback(
    () => setAnnouncementReady(true),
    [],
  );
  const onFooterSettingsReady = useCallback(
    () => setFooterSettingsReady(true),
    [],
  );

  useEffect(() => {
    void document.fonts.ready.then(() => setFontsReady(true));
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => setPreparationTimedOut(true), 5000);
    return () => window.clearTimeout(timeout);
  }, []);

  const featured = products[0];
  const bestSellers = [...products]
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 6);

  if (!featured) {
    return (
      <div className="min-h-screen bg-background">
        <Nav
          onSearch={() => {}}
          onCart={() => setCartOpen(true)}
          onWishlist={() => setWishlistOpen(true)}
          products={products}
        />
        <main className="mx-auto flex min-h-[65vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
          <p className="eyebrow text-clay">Catalog setup</p>
          <h1 className="mt-4 font-serif text-5xl tracking-tight">
            The collection is being prepared.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
            No active products are available yet. An administrator can add a
            product from the catalog dashboard.
          </p>
          <a href="/admin/products" className="mt-7 rounded-full bg-foreground px-5 py-3 text-sm text-background">
            Open product management
          </a>
        </main>
        <Footer categories={categories} />
      </div>
    );
  }

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
        onSearch={() => {}}
        onCart={() => setCartOpen(true)}
        onWishlist={() => setWishlistOpen(true)}
        products={products}
        onAnnouncementReady={onAnnouncementReady}
      />

      <main>
        <Hero featured={featured} onImagesSettled={onHeroImageSettled} />
        <Marquee />
        <CategoryBento categories={categories} />
        <FeaturedEdit products={products} categories={categories} />
        <EditorialFeature />
        <BestSellers products={bestSellers} />
        {testimonials.length > 0 && (
          <Testimonials testimonials={testimonials} />
        )}
        <Newsletter />
      </main>

      <Footer
        categories={categories}
        onSettingsReady={onFooterSettingsReady}
      />

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
      {!preparationTimedOut &&
        (!fontsReady ||
          heroImagesSettled < 2 ||
          !announcementReady ||
          !footerSettingsReady) && (
        <BrandLoadingScreen label="Preparing the collection" overlay />
      )}
    </div>
  );
}
