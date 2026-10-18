import { useEffect, useState } from "react";
import type { Collection, Product, Testimonial } from "@/types/product";
import {
  fetchCollections,
  fetchProducts,
  fetchTestimonials,
} from "@/services/api";
import { CartProvider } from "@/features/cart/CartProvider";
import { ToastProvider } from "@/features/toast/ToastProvider";
import { LandingPage } from "@/features/landing/LandingPage";
import { AlertCircle, RefreshCw } from "lucide-react";

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
          setError(err instanceof Error ? err.message : "Unable to load the store.");
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
          <p className="max-w-sm text-[13px] leading-6 text-muted-foreground">{error}</p>
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <span className="font-serif text-[22px] tracking-[0.18em] uppercase">Lumina</span>
          <span className="eyebrow text-muted-foreground">Preparing the collection</span>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <CartProvider products={data.products}>
        <LandingPage
          products={data.products}
          collections={data.collections}
          testimonials={data.testimonials}
        />
      </CartProvider>
    </ToastProvider>
  );
}

export default App;
