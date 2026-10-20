import { useEffect, useState } from "react";
import type { Collection, Product, Testimonial } from "@/types/product";
import {
  fetchCollections,
  fetchProducts,
  fetchTestimonials,
} from "@/services/api";
import { CartProvider } from "@/features/cart/CartProvider";
import { ToastProvider } from "@/features/toast/ToastProvider";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { LandingPage } from "@/features/landing/LandingPage";
import { ShopPage, ShopSkeleton } from "@/features/shop/ShopPage";
import { JournalPage } from "@/features/journal/JournalPage";
import { AboutPage } from "@/features/about/AboutPage";
import {
  ProductDetailsPage,
  ProductDetailsSkeleton,
} from "@/features/products/ProductDetailsPage";
import { AlertCircle, RefreshCw } from "lucide-react";
import { AdminDashboard } from "@/features/admin/AdminDashboard";
import { SettingsPage } from "@/features/auth/SettingsPage";
import { InfoPage } from "@/features/info/InfoPage";
import {
  CheckoutPage,
  OrderConfirmation,
  StripeCheckoutSuccessPage,
} from "@/features/checkout/CheckoutPage";

interface StoreData {
  products: Product[];
  collections: Collection[];
  testimonials: Testimonial[];
}

export function App() {
  const [data, setData] = useState<StoreData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setError(null);
        const [products, collections, testimonials] = await Promise.all([
          fetchProducts(),
          fetchCollections(),
          fetchTestimonials(),
        ]);
        if (!cancelled) setData({ products, collections, testimonials });
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load the store.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-6 text-center">
        <AlertCircle className="size-6 text-clay" strokeWidth={1.25} />
        <div className="space-y-2">
          <p className="font-serif text-3xl">The collection could not load</p>
          <p className="max-w-sm text-[13px] leading-6 text-muted-foreground">
            {error}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAttempt((value) => value + 1)}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-[13px] transition-colors hover:border-foreground/30"
        >
          <RefreshCw className="size-3.5" strokeWidth={1.25} />
          Try again
        </button>
      </div>
    );
  }

  if (!data) {
    if (window.location.pathname === "/shop") {
      return <ShopSkeleton />;
    }
    if (window.location.pathname.startsWith("/products/"))
      return <ProductDetailsSkeleton />;
    return (
      <div className="flex min-h-screen items-center justify-center overflow-hidden bg-background px-6">
        <div
          aria-hidden="true"
          className="grain-texture pointer-events-none fixed inset-0 opacity-[0.035] mix-blend-multiply"
        />
        <div className="relative flex flex-col items-center gap-5">
          <div aria-hidden="true" className="lumina-loader">
            <span />
          </div>
          <span className="font-serif text-[22px] tracking-[0.18em] uppercase">
            Lumina
          </span>
          <span className="eyebrow text-muted-foreground">
            Preparing the collection
          </span>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider products={data.products}>
          {window.location.pathname === "/admin" ||
          window.location.pathname.startsWith("/admin/") ? (
            <AdminDashboard />
          ) : window.location.pathname === "/settings" ? (
            <SettingsPage />
          ) : window.location.pathname === "/checkout" ? (
            <CheckoutPage products={data.products} />
          ) : window.location.pathname === "/checkout/success" ? (
            <StripeCheckoutSuccessPage />
          ) : window.location.pathname === "/checkout/cancel" ? (
            <OrderConfirmation
              title="Checkout cancelled"
              message="Your bag is still saved, so you can return whenever you are ready."
            />
          ) : window.location.pathname === "/shop" ? (
            <ShopPage products={data.products} />
          ) : window.location.pathname === "/about" ? (
            <AboutPage products={data.products} />
          ) : window.location.pathname === "/shipping-returns" ? (
            <InfoPage page="shipping" products={data.products} />
          ) : window.location.pathname === "/care-guide" ? (
            <InfoPage page="care" products={data.products} />
          ) : window.location.pathname === "/faq" ? (
            <InfoPage page="faq" products={data.products} />
          ) : window.location.pathname === "/privacy" ? (
            <InfoPage page="privacy" products={data.products} />
          ) : window.location.pathname === "/terms" ? (
            <InfoPage page="terms" products={data.products} />
          ) : window.location.pathname === "/journal" ||
            window.location.pathname.startsWith("/journal/") ? (
            <JournalPage
              products={data.products}
              slug={
                window.location.pathname.startsWith("/journal/")
                  ? window.location.pathname.split("/").filter(Boolean).at(-1)
                  : undefined
              }
            />
          ) : window.location.pathname.startsWith("/products/") ? (
            <ProductDetailsPage
              products={data.products}
              slug={decodeURIComponent(
                window.location.pathname.split("/").filter(Boolean).at(-1) ??
                  "",
              )}
            />
          ) : (
            <LandingPage
              products={data.products}
              collections={data.collections}
              testimonials={data.testimonials}
            />
          )}
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
