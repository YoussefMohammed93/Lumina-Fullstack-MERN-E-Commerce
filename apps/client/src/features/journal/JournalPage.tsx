import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { Product } from "@/types/product";
import type { JournalStoriesResponse, JournalStory } from "@/types/journal";
import { apiRequest } from "@/features/auth/auth-client";
import { SafeImage } from "@/components/motion/SafeImage";
import { Skeleton } from "@/components/ui/skeleton";
import { Nav } from "@/features/landing/Nav";
import { Footer } from "@/features/landing/Footer";
import { CartDrawer } from "@/features/landing/CartDrawer";
import { WishlistDrawer } from "@/features/landing/WishlistDrawer";
import { ProductCard } from "@/features/landing/ProductCard";

function Shell({
  children,
  products,
}: {
  children: React.ReactNode;
  products: Product[];
}) {
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);

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
      {children}
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

function StoryCard({
  story,
  featured = false,
}: {
  story: JournalStory;
  featured?: boolean;
}) {
  return (
    <a
      href={`/journal/${story.slug}`}
      className={`group ${featured ? "grid gap-6 md:grid-cols-2 md:items-center" : "block"}`}
    >
      <div
        className={`overflow-hidden rounded-[1.75rem] bg-muted ${featured ? "aspect-[4/3]" : "aspect-[4/3]"}`}
      >
        <SafeImage
          src={story.image}
          alt={story.imageAlt}
          eager={featured}
          className="transition-transform duration-700 ease-luxe group-hover:scale-105"
        />
      </div>
      <div className={featured ? "md:pr-8" : "mt-5"}>
        <p className="eyebrow text-clay">
          {story.category} · {story.readMinutes} min read
        </p>
        <h2
          className={`mt-3 font-serif tracking-tight ${featured ? "text-4xl sm:text-5xl" : "text-3xl"}`}
        >
          {story.title}
        </h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          {story.excerpt}
        </p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm underline underline-offset-4">
          Read story <ArrowUpRight className="size-4" />
        </span>
      </div>
    </a>
  );
}

export function JournalPage({
  products,
  slug,
}: {
  products: Product[];
  slug?: string;
}) {
  const [stories, setStories] = useState<JournalStory[]>([]);
  const [story, setStory] = useState<JournalStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const request = slug
      ? apiRequest<JournalStory>(`/journal/${encodeURIComponent(slug)}`).then(
          (result) => {
            if (!cancelled) setStory(result);
          },
        )
      : apiRequest<JournalStoriesResponse>("/journal").then((result) => {
          if (!cancelled) setStories(result.stories);
        });
    void request
      .catch((loadError: unknown) => {
        if (!cancelled)
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load journal stories.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading && slug && story?.slug !== slug)
    return (
      <Shell products={products}>
        <main className="mx-auto max-w-4xl space-y-8 px-5 pt-12 pb-20 sm:px-6">
          <Skeleton className="h-5 w-28" />
          <div className="space-y-4 pt-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-16 w-full max-w-2xl" />
            <Skeleton className="h-12 w-full max-w-xl" />
          </div>
          <Skeleton className="aspect-[16/9] w-full rounded-[1.75rem]" />
          <div className="mx-auto max-w-4xl space-y-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
          </div>
        </main>
      </Shell>
    );

  if (story && story.slug === slug)
    return <JournalArticle products={products} story={story} />;

  if (slug && error)
    return (
      <Shell products={products}>
        <main className="mx-auto flex min-h-[55vh] max-w-4xl flex-col items-start justify-center px-5 py-16 sm:px-6">
          <p className="eyebrow text-clay">Journal</p>
          <h1 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
            This story isn’t available.
          </h1>
          <p role="alert" className="mt-3 text-sm text-muted-foreground">
            {error}
          </p>
          <a
            href="/journal"
            className="mt-6 inline-flex items-center gap-2 text-sm underline underline-offset-4"
          >
            <ArrowLeft className="size-4" /> Back to all stories
          </a>
        </main>
      </Shell>
    );

  return (
    <Shell products={products}>
      <main className="mx-auto max-w-6xl px-5 pt-14 pb-20 sm:px-6 lg:px-8">
        <header className="max-w-2xl border-b border-border/70 pb-10">
          <p className="eyebrow text-clay">Journal</p>
          <h1 className="mt-4 font-serif text-5xl leading-none tracking-tight sm:text-6xl">
            Ideas for considered living.
          </h1>
          <p className="mt-5 text-sm leading-7 text-muted-foreground">
            Stories about rooms, rituals, materials, and the small details that
            make a home feel like your own.
          </p>
        </header>
        {error ? (
          <section className="mt-12 rounded-md border border-destructive/20 bg-destructive/5 p-5">
            <h2 className="font-serif text-2xl">Stories couldn’t be loaded</h2>
            <p role="alert" className="mt-2 text-sm text-destructive">
              {error}
            </p>
            <button
              type="button"
              className="mt-4 text-sm font-medium underline underline-offset-4"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </section>
        ) : loading ? (
          <section className="mt-12 space-y-12">
            <Skeleton className="aspect-[4/3] w-full rounded-[1.75rem]" />
            <div className="grid gap-12 border-t border-border/70 pt-12 md:grid-cols-2">
              <Skeleton className="aspect-[4/3] rounded-[1.75rem]" />
              <Skeleton className="aspect-[4/3] rounded-[1.75rem]" />
            </div>
          </section>
        ) : stories.length ? (
          <>
            <section className="mt-12">
              <StoryCard story={stories[0]} featured />
            </section>
            {stories.length > 1 && (
              <section className="mt-16 grid gap-12 border-t border-border/70 pt-12 md:grid-cols-2">
                {stories.slice(1).map((item) => (
                  <StoryCard key={item.id} story={item} />
                ))}
              </section>
            )}
          </>
        ) : (
          <section className="mt-12 flex min-h-56 flex-col items-center justify-center text-center">
            <p className="font-serif text-3xl">A new story is on its way.</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Come back soon for notes from the studio.
            </p>
          </section>
        )}
      </main>
    </Shell>
  );
}

function JournalArticle({
  products,
  story,
}: {
  products: Product[];
  story: JournalStory;
}) {
  const related = products
    .filter((item) => item.category === story.relatedProductCategory)
    .slice(0, 4);
  return (
    <Shell products={products}>
      <main className="mx-auto max-w-4xl px-5 pt-12 pb-20 sm:px-6">
        <a
          href="/journal"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> All stories
        </a>
        <header className="mt-10">
          <p className="eyebrow text-clay">
            {story.category} · {story.readMinutes} min read
          </p>
          <h1 className="mt-4 font-serif text-5xl leading-none tracking-tight sm:text-6xl">
            {story.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            {story.excerpt}
          </p>
        </header>
        <div className="mt-10 aspect-[16/9] overflow-hidden rounded-[1.75rem] bg-muted">
          <SafeImage eager src={story.image} alt={story.imageAlt} />
        </div>
        <article className="mx-auto mt-12 max-w-4xl space-y-6 text-[17px] leading-8 text-foreground/85">
          {story.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </article>
        {related.length > 0 && (
          <section className="mt-16 border-t border-border/70 pt-12">
            <p className="eyebrow text-clay">Featured in this story</p>
            <h2 className="mt-3 font-serif text-4xl tracking-tight">
              Shop the edit
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-4">
              {related.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </main>
    </Shell>
  );
}
