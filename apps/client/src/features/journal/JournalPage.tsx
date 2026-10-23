import { useState } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { Product } from "@/types/product";
import { SafeImage } from "@/components/motion/SafeImage";
import { Nav } from "@/features/landing/Nav";
import { Footer } from "@/features/landing/Footer";
import { CartDrawer } from "@/features/landing/CartDrawer";
import { WishlistDrawer } from "@/features/landing/WishlistDrawer";
import { ProductCard } from "@/features/landing/ProductCard";

const stories = [
  {
    slug: "a-room-that-unfolds-slowly",
    category: "Living well",
    title: "A room that unfolds slowly",
    excerpt:
      "How to build a living space through texture, proportion, and the objects that earn their place over time.",
    image:
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1500&q=85",
    readTime: "5 min read",
    body: [
      "The rooms we return to most often are rarely made all at once. They gather their character quietly: a chair that becomes a favourite reading spot, a lamp that changes the mood of an evening, a shelf that holds the things worth keeping close.",
      "Start with comfort rather than completion. Choose one generous anchor, then leave enough space for the room to breathe. The best additions are not the loudest ones; they bring warmth, useful texture, or a shape that balances everything nearby.",
      "Let materials do some of the work. Wool softens a hard line. Oak brings visual calm. A hand-finished object offers a small moment of attention in an otherwise busy day.",
    ],
    categoryFilter: "Living",
  },
  {
    slug: "the-pleasure-of-the-table",
    category: "At the table",
    title: "The pleasure of the table",
    excerpt:
      "A few thoughtful pieces are all it takes to make an ordinary meal feel unhurried and generous.",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85",
    readTime: "4 min read",
    body: [
      "The table is one of the simplest places to make a ritual. It asks very little: a surface worth gathering around, a useful vessel, and the time to notice what is in front of you.",
      "Favour pieces that become better with use. Linen that relaxes after every wash, stoneware with the slight irregularity of a hand, and glass that catches the last of the afternoon light all make a meal feel personal.",
      "There is no need to match everything. A restrained palette and a few tactile materials are enough to make the setting feel considered without becoming precious.",
    ],
    categoryFilter: "Dining",
  },
  {
    slug: "lighting-for-the-hours-after-dark",
    category: "Light study",
    title: "Lighting for the hours after dark",
    excerpt:
      "Why layered, lower light makes a home feel more welcoming—and where to begin.",
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=85",
    readTime: "3 min read",
    body: [
      "Good lighting is less about brightness than atmosphere. The right pool of light makes a corner useful, gives a table a centre, and lets the rest of the room recede.",
      "Begin with more than one source. A table lamp at eye level can soften the edges of a room, while a pendant gives shape to the space beneath it. Together they are far more inviting than a single overhead fixture.",
      "Choose shades and finishes that diffuse rather than glare. The aim is light that stays with you, not light that demands to be noticed.",
    ],
    categoryFilter: "Lighting",
  },
] as const;

type Story = (typeof stories)[number];

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
  story: Story;
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
          alt=""
          eager={featured}
          className="transition-transform duration-700 ease-luxe group-hover:scale-105"
        />
      </div>
      <div className={featured ? "md:pr-8" : "mt-5"}>
        <p className="eyebrow text-clay">
          {story.category} · {story.readTime}
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
  const story = slug ? stories.find((item) => item.slug === slug) : undefined;

  if (slug && !story) {
    window.location.replace("/journal");
    return null;
  }

  if (story) return <JournalArticle products={products} story={story} />;

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
        <section className="mt-12">
          <StoryCard story={stories[0]} featured />
        </section>
        <section className="mt-16 grid gap-12 border-t border-border/70 pt-12 md:grid-cols-2">
          {stories.slice(1).map((item) => (
            <StoryCard key={item.slug} story={item} />
          ))}
        </section>
      </main>
    </Shell>
  );
}

function JournalArticle({
  products,
  story,
}: {
  products: Product[];
  story: Story;
}) {
  const related = products
    .filter((item) => item.category === story.categoryFilter)
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
            {story.category} · {story.readTime}
          </p>
          <h1 className="mt-4 font-serif text-5xl leading-none tracking-tight sm:text-6xl">
            {story.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            {story.excerpt}
          </p>
        </header>
        <div className="mt-10 aspect-[16/9] overflow-hidden rounded-[1.75rem] bg-muted">
          <SafeImage eager src={story.image} alt="" />
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
