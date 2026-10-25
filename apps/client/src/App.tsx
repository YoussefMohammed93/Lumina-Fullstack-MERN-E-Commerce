import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import type { Category, Product, Testimonial } from "@/types/product";
import {
  fetchCategories,
  fetchProducts,
  fetchTestimonials,
} from "@/services/api";
import { CartProvider } from "@/features/cart/CartProvider";
import { ToastProvider } from "@/features/toast/ToastProvider";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { AlertCircle, RefreshCw } from "lucide-react";
import {
  StorefrontLayout,
  StorefrontLoadingLayout,
} from "@/components/StorefrontLayout";
import { BrandLoadingScreen } from "@/components/BrandLogo";
import { useAuth } from "@/features/auth/useAuth";

const LandingPage = lazy(() =>
  import("@/features/landing/LandingPage").then((module) => ({
    default: module.LandingPage,
  })),
);
const ShopPage = lazy(() =>
  import("@/features/shop/ShopPage").then((module) => ({
    default: module.ShopPage,
  })),
);
const JournalPage = lazy(() =>
  import("@/features/journal/JournalPage").then((module) => ({
    default: module.JournalPage,
  })),
);
const AboutPage = lazy(() =>
  import("@/features/about/AboutPage").then((module) => ({
    default: module.AboutPage,
  })),
);
const ProductDetailsPage = lazy(() =>
  import("@/features/products/ProductDetailsPage").then((module) => ({
    default: module.ProductDetailsPage,
  })),
);
const AdminDashboard = lazy(() =>
  import("@/features/admin/AdminDashboard").then((module) => ({
    default: module.AdminDashboard,
  })),
);
const SettingsPage = lazy(() =>
  import("@/features/auth/SettingsPage").then((module) => ({
    default: module.SettingsPage,
  })),
);
const OrderTrackingPage = lazy(() =>
  import("@/features/orders/OrderTrackingPage").then((module) => ({
    default: module.OrderTrackingPage,
  })),
);
const InfoPage = lazy(() =>
  import("@/features/info/InfoPage").then((module) => ({
    default: module.InfoPage,
  })),
);
const CartPage = lazy(() =>
  import("@/features/cart/CartPage").then((module) => ({
    default: module.CartPage,
  })),
);
const CheckoutPage = lazy(() =>
  import("@/features/checkout/CheckoutPage").then((module) => ({
    default: module.CheckoutPage,
  })),
);
const OrderConfirmation = lazy(() =>
  import("@/features/checkout/CheckoutPage").then((module) => ({
    default: module.OrderConfirmation,
  })),
);
const StripeCheckoutSuccessPage = lazy(() =>
  import("@/features/checkout/CheckoutPage").then((module) => ({
    default: module.StripeCheckoutSuccessPage,
  })),
);

interface StoreData {
  products: Product[];
  categories: Category[];
  testimonials: Testimonial[];
}

function AuthenticatedRoute({
  children,
  products,
  categories,
}: {
  children: ReactNode;
  products: Product[];
  categories: Category[];
}) {
  const { user, loading, openAuth } = useAuth();

  if (loading) {
    return (
      <StorefrontLoadingLayout>
        <main
          aria-label="Checking your account"
          className="mx-auto min-h-[55vh] max-w-6xl px-5 py-16 sm:px-8"
        >
          <div className="mx-auto max-w-md animate-pulse space-y-4 text-center">
            <div className="mx-auto h-3 w-28 rounded bg-muted" />
            <div className="mx-auto h-10 w-72 max-w-full rounded bg-muted" />
            <div className="mx-auto h-4 w-64 max-w-full rounded bg-muted" />
          </div>
        </main>
      </StorefrontLoadingLayout>
    );
  }

  if (!user) {
    return (
      <StorefrontLayout products={products} categories={categories}>
        <main className="flex min-h-[55vh] flex-col items-center justify-center px-6 text-center">
          <p className="eyebrow text-clay">Your account</p>
          <h1 className="mt-3 font-serif text-4xl">Sign in to continue</h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
            Sign in to view your account and order details.
          </p>
          <button
            type="button"
            onClick={openAuth}
            className="mt-6 rounded-full bg-foreground px-5 py-3 text-sm text-background transition-colors hover:bg-clay"
          >
            Sign in to your account
          </button>
        </main>
      </StorefrontLayout>
    );
  }

  return children;
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
        const [products, categories, testimonials] = await Promise.all([
          fetchProducts(),
          fetchCategories(),
          fetchTestimonials(),
        ]);
        if (!cancelled) setData({ products, categories, testimonials });
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
    return <BrandLoadingScreen label="Preparing the collection" />;
  }

  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider products={data.products}>
          <Suspense
            fallback={<BrandLoadingScreen label="Preparing your page" />}
          >
            {window.location.pathname === "/admin" ||
            window.location.pathname.startsWith("/admin/") ? (
              <AdminDashboard products={data.products} />
            ) : window.location.pathname === "/settings" ? (
              <AuthenticatedRoute
                products={data.products}
                categories={data.categories}
              >
                <SettingsPage
                  products={data.products}
                  categories={data.categories}
                />
              </AuthenticatedRoute>
            ) : window.location.pathname.startsWith("/orders/") ? (
              <AuthenticatedRoute
                products={data.products}
                categories={data.categories}
              >
                <OrderTrackingPage
                  orderId={decodeURIComponent(
                    window.location.pathname
                      .split("/")
                      .filter(Boolean)
                      .at(-1) ?? "",
                  )}
                  products={data.products}
                  categories={data.categories}
                />
              </AuthenticatedRoute>
            ) : window.location.pathname === "/cart" ? (
              <CartPage products={data.products} />
            ) : window.location.pathname === "/checkout" ? (
              <StorefrontLayout
                products={data.products}
                categories={data.categories}
              >
                <CheckoutPage products={data.products} />
              </StorefrontLayout>
            ) : window.location.pathname === "/checkout/success" ? (
              <StripeCheckoutSuccessPage />
            ) : window.location.pathname === "/checkout/cancel" ? (
              <OrderConfirmation
                title="Checkout cancelled"
                message="Your bag is still saved, so you can return whenever you are ready."
              />
            ) : window.location.pathname === "/shop" ? (
              <ShopPage products={data.products} categories={data.categories} />
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
                  window.location.pathname
                    .split("/")
                    .filter(Boolean)
                    .at(-1) ?? "",
                )}
              />
            ) : (
              <LandingPage
                products={data.products}
                categories={data.categories}
                testimonials={data.testimonials}
              />
            )}
          </Suspense>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
