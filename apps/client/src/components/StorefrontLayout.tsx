import { useState, type ReactNode } from "react";
import type { Category, Product } from "@/types/product";
import { Skeleton } from "@/components/ui/skeleton";
import { Footer } from "@/features/landing/Footer";
import { Nav } from "@/features/landing/Nav";
import { WishlistDrawer } from "@/features/landing/WishlistDrawer";

export function StorefrontLayout({
  children,
  products,
  categories,
}: {
  children: ReactNode;
  products: Product[];
  categories: Category[];
}) {
  const [wishlistOpen, setWishlistOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <Nav
        onSearch={() => {
          window.location.href = "/shop";
        }}
        onCart={() => {
          window.location.href = "/cart";
        }}
        onWishlist={() => setWishlistOpen(true)}
        products={products}
      />
      {children}
      <Footer categories={categories} />
      <WishlistDrawer
        open={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        products={products}
      />
    </div>
  );
}

export function StorefrontLoadingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <header
        aria-hidden="true"
        className="mx-4 mt-3 flex h-16 items-center rounded-full border border-border/50 bg-background/70 px-5 sm:mx-6 lg:mx-auto lg:max-w-6xl"
      >
        <Skeleton className="h-5 w-28 rounded-full" />
        <div className="ml-12 hidden gap-6 md:flex">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-3 w-14" />
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="size-9 rounded-full" />
          ))}
        </div>
      </header>
      {children}
      <footer
        aria-hidden="true"
        className="border-t border-border/70 px-5 pt-12 pb-8 sm:px-8"
      >
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="grid gap-10 border-b border-border/70 pb-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-4">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-3 w-52 max-w-full" />
              <Skeleton className="h-3 w-44 max-w-full" />
            </div>
            {[0, 1, 2].map((column) => (
              <div key={column} className="space-y-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-6 h-3 w-52" />
        </div>
      </footer>
    </div>
  );
}
