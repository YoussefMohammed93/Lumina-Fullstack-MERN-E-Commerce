import { useState } from "react";
import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react";
import type { Product } from "@/types/product";
import { Nav } from "@/features/landing/Nav";
import { Footer } from "@/features/landing/Footer";
import { WishlistDrawer } from "@/features/landing/WishlistDrawer";
import { SafeImage } from "@/components/motion/SafeImage";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/services/api";
import { useCart } from "./useCart";

export function CartSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-4 mt-3 flex h-16 max-w-6xl items-center rounded-full border border-border/50 px-5 sm:mx-6 lg:mx-auto">
        <Skeleton className="h-5 w-28 rounded-full" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
        <Skeleton className="h-3 w-16" />
        <div className="mt-4 flex items-end justify-between gap-4">
          <Skeleton className="h-11 w-72 max-w-[75%] sm:h-13" />
          <Skeleton className="h-4 w-14" />
        </div>
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="divide-y divide-border/70 border-y border-border/70">
            {[0, 1].map((item) => (
              <div key={item} className="grid gap-4 py-5 sm:grid-cols-[132px_minmax(0,1fr)_auto]">
                <Skeleton className="aspect-square rounded-xl" />
                <div className="space-y-4">
                  <div className="flex justify-between gap-4"><div className="space-y-2"><Skeleton className="h-3 w-16" /><Skeleton className="h-7 w-44" /></div><Skeleton className="size-7 rounded-full" /></div>
                  <div className="grid gap-3 sm:grid-cols-2"><div><Skeleton className="h-3 w-24" /><Skeleton className="mt-2 h-10 w-full" /></div><div><Skeleton className="h-3 w-20" /><Skeleton className="mt-2 h-10 w-full" /></div></div>
                  <Skeleton className="h-9 w-28 rounded-full" />
                </div>
                <Skeleton className="h-5 w-20 self-end justify-self-end" />
              </div>
            ))}
          </div>
          <aside className="h-fit rounded-2xl border border-border bg-card p-5"><Skeleton className="h-3 w-24" /><Skeleton className="mt-6 h-5 w-full" /><Skeleton className="mt-5 h-12 w-full rounded-full" /><Skeleton className="mt-4 h-4 w-32" /></aside>
        </div>
      </main>
    </div>
  );
}

export function CartPage({ products }: { products: Product[] }) {
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const { lines, subtotal, totalQuantity, removeItem, setQuantity, setVariant } = useCart();
  const items = lines.flatMap((line) => {
    const product = products.find((item) => item.id === line.productId);
    const variant = product?.variants?.find((item) => item.id === line.variantId);
    return product && variant ? [{ line, product, variant }] : [];
  });
  return (
    <div className="min-h-screen bg-background">
      <Nav
        onSearch={() => {
          window.location.href = "/shop";
        }}
        onCart={() => {}}
        onWishlist={() => setWishlistOpen(true)}
        products={products}
      />
      <main className="mx-auto max-w-6xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
        <p className="eyebrow text-clay">Your bag</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
            Review your selections.
          </h1>
          <span className="text-sm text-muted-foreground">
            {totalQuantity} item{totalQuantity === 1 ? "" : "s"}
          </span>
        </div>
        {!items.length ? (
          <EmptyCart />
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <ul className="divide-y divide-border/70 border-y border-border/70">
              {items.map(({ line, product, variant }) => (
                <li
                  key={`${line.productId}-${line.variantId}`}
                  className="grid gap-4 py-5 sm:grid-cols-[132px_minmax(0,1fr)_auto]"
                >
                  <div className="aspect-square overflow-hidden rounded-xl bg-muted">
                    <SafeImage src={product.images[0]} alt={product.name} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="eyebrow text-muted-foreground">
                          {product.category}
                        </p>
                        <h2 className="mt-1 font-serif text-2xl">
                          {product.name}
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(product.id, variant.id)}
                        className="p-1 text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${product.name}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Selected option
                        <Select
                          value={variant.id}
                          onValueChange={(value) =>
                            setVariant(product.id, variant.id, value)
                          }
                        >
                          <SelectTrigger className="mt-1 h-10 px-3 text-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(product.variants ?? [])
                              .filter((item) => item.isActive)
                              .map((item) => (
                                <SelectItem
                                  key={item.id}
                                  value={item.id}
                                  disabled={item.stock === 0}
                                  className={item.stock === 0 ? "line-through" : undefined}
                                >
                                  {optionLabel(item)}
                                  {item.stock === 0 ? " — sold out" : ""}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </label>
                      <div className="text-xs font-medium text-muted-foreground">
                        Availability
                        <p className="mt-1 h-10 rounded-lg border bg-card px-3 py-2.5 text-sm text-foreground">
                          {variant.stock} in stock
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex items-center rounded-full border border-border">
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity(product.id, variant.id, line.quantity - 1)
                          }
                          className="flex size-9 items-center justify-center"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-7 text-center text-sm">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity(
                              product.id,
                              variant.id,
                              Math.min(variant.stock, line.quantity + 1),
                            )
                          }
                          disabled={line.quantity >= variant.stock}
                          className="flex size-9 items-center justify-center disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <a
                        href={`/products/${product.slug}`}
                        className="text-xs underline underline-offset-4"
                      >
                        View product
                      </a>
                    </div>
                  </div>
                  <p className="self-end text-right text-base font-medium sm:text-lg">
                    {formatPrice(variant.price * line.quantity)}
                  </p>
                </li>
              ))}
            </ul>
            <aside className="h-fit rounded-md border border-border bg-card p-5 lg:sticky lg:top-6">
              <p className="eyebrow text-muted-foreground">Order summary</p>
              <div className="mt-5 flex justify-between border-b border-border pb-4 text-sm">
                <span>Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                Review each product’s color, size, price, and quantity before
                checkout. Shipping is calculated at checkout.
              </p>
              <a
                href="/checkout"
                className="mt-6 flex h-12 items-center justify-center rounded-full bg-foreground gap-2 px-5 text-sm font-medium text-background"
              >
                Continue to checkout
                <ArrowRight className="size-4 mt-0.5" />
              </a>
              <a
                href="/shop"
                className="mt-4 block text-center text-sm underline underline-offset-4"
              >
                Continue shopping
              </a>
            </aside>
          </div>
        )}
      </main>
      <Footer />
      <WishlistDrawer
        open={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        products={products}
      />
    </div>
  );
}
function optionLabel(variant: NonNullable<Product["variants"]>[number]) { const choices = Object.entries(variant.attributes).filter(([, value]) => value).map(([name, value]) => `${name}: ${value}`); return choices.join(" · ") || variant.sku; }
function EmptyCart() { return <div className="mt-10 rounded-2xl border border-dashed border-border px-6 py-20 text-center"><h2 className="font-serif text-3xl">Your bag is empty.</h2><p className="mt-3 text-sm text-muted-foreground">Explore the collection and add something considered.</p><Button asChild className="mt-6 rounded-full"><a href="/shop">Shop products</a></Button></div>; }
