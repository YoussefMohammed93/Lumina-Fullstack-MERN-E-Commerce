import { useState, type FormEvent } from "react";
import { Heart, Minus, Plus, ShoppingBag, Star } from "lucide-react";
import type { Product } from "@/types/product";
import { getProductBySlug, formatPrice } from "@/services/api";
import { SafeImage } from "@/components/motion/SafeImage";
import { StarRating } from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Nav } from "@/features/landing/Nav";
import { Footer } from "@/features/landing/Footer";
import { CartDrawer } from "@/features/landing/CartDrawer";
import { WishlistDrawer } from "@/features/landing/WishlistDrawer";
import { ProductCard } from "@/features/landing/ProductCard";
import { useCart } from "@/features/cart/useCart";
import { useToast } from "@/features/toast/ToastProvider";
import { authenticatedRequest } from "@/features/auth/auth-client";
import { useAuth } from "@/features/auth/useAuth";
import { cn } from "@/lib/utils";

const demoReviews = [
  {
    name: "Amara D.",
    date: "February 2026",
    rating: 5,
    text: "Beautifully made and even more considered in person. It has become part of my daily rhythm.",
  },
  {
    name: "Daniel R.",
    date: "January 2026",
    rating: 4,
    text: "Thoughtful materials and a quietly excellent finish. Exactly what I hoped for.",
  },
];

export function ProductDetailsSkeleton() {
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
      <main className="mx-auto max-w-6xl px-5 pt-8 pb-20 sm:px-6 lg:px-8">
        <Skeleton className="h-3 w-72" />
        <section className="mt-7 grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,.92fr)] lg:gap-14">
          <div className="flex flex-col gap-3 sm:flex-row-reverse">
            <Skeleton className="aspect-square flex-1 rounded-[1.75rem]" />
            <div className="flex gap-2 sm:w-20 sm:flex-col">
              <Skeleton className="size-16 rounded-xl sm:size-20" />
              <Skeleton className="size-16 rounded-xl sm:size-20" />
            </div>
          </div>
          <div className="space-y-5 lg:pt-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-14 w-3/4" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-20" />
            <Skeleton className="h-12 rounded-full" />
          </div>
        </section>
        <section className="mt-20 grid gap-12 border-t border-border/70 pt-14 lg:grid-cols-[.85fr_1.15fr]">
          <div className="space-y-5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-44" />
          </div>
          <div className="space-y-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-28 rounded-[1.5rem]" />
            <Skeleton className="h-32" />
          </div>
        </section>
        <section className="mt-20 border-t border-border/70 pt-14">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-3 h-10 w-56" />
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="aspect-[4/5] rounded-[1.5rem]" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export function ProductDetailsPage({
  products,
  slug,
}: {
  products: Product[];
  slug: string;
}) {
  const product = getProductBySlug(slug, products);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);

  if (!product)
    return (
      <NotFound
        onCart={() => setCartOpen(true)}
        onWishlist={() => setWishlistOpen(true)}
      />
    );

  const related = products
    .filter(
      (item) => item.id !== product.id && item.category === product.category,
    )
    .slice(0, 4);

  const fallbackRelated = related.length
    ? related
    : products.filter((item) => item.id !== product.id).slice(0, 4);

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
      />
      <main className="mx-auto max-w-6xl px-5 pt-8 pb-20 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
        >
          <a href="/" className="hover:text-foreground">
            Home
          </a>
          <span aria-hidden="true">/</span>
          <a href="/shop" className="hover:text-foreground">
            Shop
          </a>
          <span aria-hidden="true">/</span>
          <a
            href={`/shop?category=${encodeURIComponent(product.category)}`}
            className="hover:text-foreground"
          >
            {product.category}
          </a>
          <span aria-hidden="true">/</span>
          <span className="text-foreground" aria-current="page">
            {product.name}
          </span>
        </nav>
        <section className="mt-7 grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,.92fr)] lg:gap-14">
          <ProductGallery product={product} />
          <ProductInfo product={product} />
        </section>
        <section className="mt-20 grid gap-12 border-t border-border/70 pt-14 lg:grid-cols-[.85fr_1.15fr]">
          <Specifications product={product} />
          <Reviews product={product} />
        </section>
        <ReviewForm productId={product.id} />
        <section className="mt-20 border-t border-border/70 pt-14">
          <p className="eyebrow text-clay">Considered together</p>
          <h2 className="mt-3 font-serif text-4xl tracking-tight">
            You may also like
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
            {fallbackRelated.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
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

function ProductGallery({ product }: { product: Product }) {
  const [active, setActive] = useState(0);
  const images = product.images.length ? product.images : [""];

  return (
    <div className="flex flex-col gap-3 sm:flex-row-reverse sm:items-start">
      <div className="aspect-square flex-1 overflow-hidden rounded-[1.75rem] bg-muted">
        <SafeImage
          eager
          src={images[active] ?? images[0]}
          alt={`${product.name}, image ${active + 1}`}
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto sm:w-20 sm:flex-col">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show image ${index + 1} of ${product.name}`}
              aria-current={active === index}
              className={cn(
                "size-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors sm:size-20",
                active === index
                  ? "border-clay"
                  : "border-transparent opacity-80 hover:opacity-100",
              )}
            >
              <SafeImage src={image} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductInfo({ product }: { product: Product }) {
  const { addItem, isWishlisted, toggleWishlist } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const wished = isWishlisted(product.id);

  const add = () => {
    if (!addItem(product, quantity)) return;
    toast("Added to your bag", `${quantity} × ${product.name}`);
  };

  const toggle = () => {
    const saved = toggleWishlist(product.id);
    if (!saved && !isWishlisted(product.id)) return;
    toast(
      saved ? "Saved to your list" : "Removed from your list",
      product.name,
    );
  };

  return (
    <div className="flex flex-col lg:pt-3">
      <div className="flex items-start justify-between gap-5">
        <p className="eyebrow text-clay">{product.category}</p>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={wished}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          className="flex size-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-muted"
        >
          <Heart
            className={cn("size-4", wished && "fill-clay text-clay")}
            strokeWidth={1.25}
          />
        </button>
      </div>
      <h1 className="mt-4 font-serif text-4xl leading-none tracking-tight sm:text-5xl">
        {product.name}
      </h1>
      <div className="mt-5 flex items-center gap-3">
        <StarRating rating={product.rating} />
        <span className="tabular text-sm">{product.rating.toFixed(1)}</span>
        <span className="text-sm text-muted-foreground">
          {product.reviewCount} reviews
        </span>
      </div>
      <div className="mt-6 flex items-baseline gap-3">
        <span className="tabular text-xl font-medium">
          {formatPrice(product.price)}
        </span>
        {product.compareAtPrice && (
          <span className="tabular text-sm text-muted-foreground line-through">
            {formatPrice(product.compareAtPrice)}
          </span>
        )}
      </div>
      <p
        className={cn(
          "mt-3 text-sm",
          product.stock > 0 ? "text-clay" : "text-destructive",
        )}
      >
        {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
      </p>
      <p className="mt-7 max-w-xl text-sm leading-7 text-muted-foreground">
        {product.description}
      </p>
      <div className="mt-8 border-y border-border/70 py-6">
        <p className="eyebrow text-muted-foreground">Quantity</p>
        <div className="mt-3 flex items-center gap-4">
          <div className="flex items-center rounded-full border border-border bg-card">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              disabled={quantity === 1}
              aria-label="Decrease quantity"
            >
              <Minus className="size-3.5" />
            </Button>
            <span className="tabular w-8 text-center text-sm">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setQuantity((value) => Math.min(product.stock || 1, value + 1))
              }
              disabled={quantity >= product.stock}
              aria-label="Increase quantity"
            >
              <Plus className="size-3.5" />
            </Button>
          </div>
          <span className="tabular text-sm text-muted-foreground">
            {formatPrice(product.price * quantity)}
          </span>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
        <Button
          size="lg"
          onClick={add}
          disabled={product.stock === 0}
          className="h-12 rounded-full"
        >
          <ShoppingBag className="size-4" />
          {product.stock ? "Add to bag" : "Out of stock"}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={toggle}
          aria-pressed={wished}
          className="h-12 rounded-full px-5"
        >
          {wished ? "Wishlisted" : "Add to wishlist"}
        </Button>
      </div>
    </div>
  );
}

function Specifications({ product }: { product: Product }) {
  const items = [
    ["Materials", product.materials],
    ["Dimensions", product.dimensions],
    ["Category", product.category],
    ["Availability", product.stock > 0 ? "In stock" : "Out of stock"],
    ["Inventory", `${product.stock} pieces`],
  ].filter(([, value]) => Boolean(value));

  return (
    <section>
      <p className="eyebrow text-clay">Details</p>
      <h2 className="mt-3 font-serif text-4xl tracking-tight">
        Product information
      </h2>
      <dl className="mt-7 divide-y divide-border/70 border-y border-border/70">
        {items.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-6 py-3 text-sm">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="max-w-[60%] text-right">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Reviews({ product }: { product: Product }) {
  return (
    <section>
      <p className="eyebrow text-clay">Community</p>
      <h2 className="mt-3 font-serif text-4xl tracking-tight">
        Customer reviews
      </h2>
      <div className="mt-7 flex items-center gap-5 rounded-[1.5rem] bg-muted/60 p-5">
        <span className="font-serif text-5xl">{product.rating.toFixed(1)}</span>
        <div>
          <StarRating
            rating={product.rating}
            className="scale-110 origin-left"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Based on available ratings
          </p>
        </div>
      </div>
      <div className="mt-8 space-y-5">
        {demoReviews.map((review) => (
          <article key={review.name} className="border-b border-border/70 pb-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{review.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sample review · {review.date}
                </p>
              </div>
              <Stars value={review.rating} />
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {review.text}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
function ReviewForm({ productId }: { productId: string }) {
  const { toast } = useToast();
  const { user, csrfToken, openAuth } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !csrfToken) {
      openAuth();
      return;
    }

    if (!rating || !comment.trim()) {
      toast("Complete your review", "Choose a rating and add a comment.");
      return;
    }

    try {
      await authenticatedRequest(
        `/products/${encodeURIComponent(productId)}/reviews`,
        csrfToken,
        { method: "POST", body: JSON.stringify({ rating, comment }) },
      );
      toast("Review submitted", "It will appear after moderation.");
      setRating(0);
      setComment("");
    } catch (error) {
      toast(
        "Could not submit review",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  return (
    <form onSubmit={submit} className="mt-14 border-t border-border/70 pt-14">
      <div className="rounded-[1.75rem] border border-border bg-card p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="eyebrow text-clay">Share your perspective</p>
            <h2 className="mt-3 font-serif text-4xl tracking-tight">
              Write a review
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              {user
                ? "Your review will be published after moderation."
                : "Sign in to share your perspective."}
            </p>
          </div>
          <button
            type="button"
            onClick={openAuth}
            className="shrink-0 text-sm underline underline-offset-4"
          >
            {user
              ? `Signed in as ${user.username}`
              : "Sign in to leave a review"}
          </button>
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(220px,.35fr)_minmax(0,1fr)]">
          <fieldset>
            <legend className="text-sm font-medium">Your rating</legend>
            <div className="mt-3 flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  aria-label={`${value} star${value === 1 ? "" : "s"}`}
                  aria-pressed={rating === value}
                  className="rounded-full p-1.5 text-clay transition-colors hover:bg-muted"
                >
                  <Star
                    className={cn("size-6", value <= rating && "fill-current")}
                  />
                </button>
              ))}
            </div>
          </fieldset>
          <label className="block text-sm font-medium">
            Your review
            <Textarea
              className="mt-3 min-h-36"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={500}
              placeholder="Share your experience..."
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>{comment.length}/500</span>
          <Button type="submit" variant="outline" className="rounded-full">
            Submit review
          </Button>
        </div>
      </div>
    </form>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span
      className="flex gap-0.5 text-clay"
      aria-label={`${value} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn("size-3", index < value && "fill-current")}
        />
      ))}
    </span>
  );
}

function NotFound({
  onCart,
  onWishlist,
}: {
  onCart: () => void;
  onWishlist: () => void;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Nav
        onSearch={() => {
          window.location.href = "/shop";
        }}
        onCart={onCart}
        onWishlist={onWishlist}
      />
      <main className="mx-auto flex min-h-[65vh] max-w-6xl flex-col items-center justify-center px-6 text-center">
        <p className="eyebrow text-clay">404</p>
        <h1 className="mt-4 font-serif text-5xl tracking-tight">
          Product not found
        </h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
          The product you&apos;re looking for doesn&apos;t exist or may have
          been removed.
        </p>
        <a
          href="/shop"
          className="mt-7 rounded-full bg-foreground px-5 py-3 text-sm text-background"
        >
          Back to shop
        </a>
      </main>
      <Footer />
    </div>
  );
}
