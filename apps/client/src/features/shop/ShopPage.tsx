import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type { Product } from "@/types/product";
import { Drawer } from "@/components/Drawer";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Nav } from "@/features/landing/Nav";
import { Footer } from "@/features/landing/Footer";
import { CartDrawer } from "@/features/landing/CartDrawer";
import { WishlistDrawer } from "@/features/landing/WishlistDrawer";
import { ProductCard } from "@/features/landing/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

const PRODUCTS_PER_PAGE = 8;
const sortOptions = [
  ["featured", "Featured"],
  ["price-asc", "Price: Low to High"],
  ["price-desc", "Price: High to Low"],
  ["rating-desc", "Rating: High to Low"],
  ["name-asc", "Name: A → Z"],
  ["name-desc", "Name: Z → A"],
] as const;
type Sort = (typeof sortOptions)[number][0];
type Availability = "all" | "in-stock" | "out-of-stock";

interface ShopQuery {
  search: string;
  categories: string[];
  minPrice: string;
  maxPrice: string;
  rating: number;
  availability: Availability;
  sort: Sort;
  page: number;
}

function normalizeCategory(value: string) {
  // Supports legacy collection URLs such as "01 · Living" as well as
  // the plain catalog categories used by the filter controls.
  return value.replace(/^\d+\s*[^A-Za-z]*\s*/, "").trim();
}

function readQuery(): ShopQuery {
  const params = new URLSearchParams(window.location.search);
  const sort = params.get("sort") as Sort;

  return {
    search: params.get("search") ?? "",
    categories: params.getAll("category").map(normalizeCategory).filter(Boolean),
    minPrice: params.get("minPrice") ?? "",
    maxPrice: params.get("maxPrice") ?? "",
    rating: Number(params.get("rating")) || 0,
    availability: (params.get("availability") as Availability) || "all",
    sort: sortOptions.some(([value]) => value === sort) ? sort : "featured",
    page: Math.max(1, Number(params.get("page")) || 1),
  };
}

function writeQuery(query: ShopQuery) {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);

  query.categories.forEach((category) => params.append("category", category));
  if (query.minPrice) params.set("minPrice", query.minPrice);
  if (query.maxPrice) params.set("maxPrice", query.maxPrice);
  if (query.rating) params.set("rating", String(query.rating));

  if (query.availability !== "all")
    params.set("availability", query.availability);

  if (query.sort !== "featured") params.set("sort", query.sort);
  if (query.page > 1) params.set("page", String(query.page));

  const suffix = params.toString();

  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${suffix ? `?${suffix}` : ""}`,
  );
}

function FilterControls({
  query,
  onChange,
  categories,
}: {
  query: ShopQuery;
  onChange: (patch: Partial<ShopQuery>, resetPage?: boolean) => void;
  categories: string[];
}) {
  const toggleCategory = (category: string) =>
    onChange({
      categories: query.categories.includes(category)
        ? query.categories.filter((item) => item !== category)
        : [...query.categories, category],
    });

  return (
    <div className="space-y-7">
      <section>
        <p className="eyebrow mb-3 text-muted-foreground">Categories</p>
        <div className="space-y-2">
          {categories.map((category) => (
            <label
              key={category}
              className="flex cursor-pointer items-center gap-3 text-[13px]"
            >
              <Checkbox
                checked={query.categories.includes(category)}
                onCheckedChange={() => toggleCategory(category)}
              />
              {category}
            </label>
          ))}
        </div>
      </section>
      <section>
        <p className="eyebrow mb-3 text-muted-foreground">Price</p>
        <div className="grid grid-cols-2 gap-2">
          <Input
            aria-label="Minimum price"
            type="number"
            min="0"
            placeholder="Min"
            value={query.minPrice}
            onChange={(e) => onChange({ minPrice: e.target.value })}
          />
          <Input
            aria-label="Maximum price"
            type="number"
            min="0"
            placeholder="Max"
            value={query.maxPrice}
            onChange={(e) => onChange({ maxPrice: e.target.value })}
          />
        </div>
        {Number(query.maxPrice) > 0 &&
          Number(query.minPrice) > Number(query.maxPrice) && (
            <p className="mt-2 text-xs text-destructive">
              Max must be at least the minimum.
            </p>
          )}
      </section>
      <section>
        <p className="eyebrow mb-3 text-muted-foreground">Rating</p>
        <RadioGroup
          value={String(query.rating)}
          onValueChange={(value) => onChange({ rating: Number(value) })}
        >
          {[4, 3, 2, 1].map((rating) => (
            <label
              key={rating}
              className="flex cursor-pointer items-center gap-3 text-[13px]"
            >
              <RadioGroupItem value={String(rating)} />
              {rating}★ & up
            </label>
          ))}
          {query.rating > 0 && (
            <button
              type="button"
              onClick={() => onChange({ rating: 0 })}
              className="text-xs text-muted-foreground underline underline-offset-4"
            >
              Any rating
            </button>
          )}
        </RadioGroup>
      </section>
      <section>
        <p className="eyebrow mb-3 text-muted-foreground">Availability</p>
        <RadioGroup
          value={query.availability}
          onValueChange={(value) =>
            onChange({ availability: value as Availability })
          }
        >
          {(
            [
              ["all", "All products"],
              ["in-stock", "In stock"],
              ["out-of-stock", "Out of stock"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-3 text-[13px]"
            >
              <RadioGroupItem value={value} />
              {label}
            </label>
          ))}
        </RadioGroup>
      </section>
    </div>
  );
}

export function ShopSkeleton() {
  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <header className="mx-4 mt-3 flex h-16 max-w-6xl items-center rounded-full border border-border/50 px-5 sm:mx-6 lg:mx-auto sm:px-7">
        <span className="font-serif text-[22px] tracking-[0.18em] uppercase">
          Lumina
        </span>
        <div className="ml-12 hidden gap-6 md:flex">
          <Skeleton className="h-3 w-9" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-11" />
        </div>
        <div className="ml-auto flex gap-2">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 pt-14 pb-20 sm:px-6 lg:px-8">
        <header className="border-b border-border/70 pb-8">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="mt-4 h-10 w-full max-w-md sm:h-12" />
          <Skeleton className="mt-4 h-4 w-full max-w-sm" />
        </header>
        <Skeleton className="mt-7 h-12 w-full rounded-full" />
        <div className="mt-7 grid gap-8 lg:grid-cols-[190px_minmax(0,1fr)]">
          <aside className="hidden border-r border-border/70 pr-7 lg:block">
            <Skeleton className="h-3 w-14" />
            <div className="mt-7 space-y-4">
              <Skeleton className="h-3 w-20" />
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="size-5 rounded-[4px]" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
              <Skeleton className="mt-8 h-3 w-12" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-8" />
                <Skeleton className="h-8" />
              </div>
              <Skeleton className="mt-8 h-3 w-12" />
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="mt-3 flex items-center gap-3">
                  <Skeleton className="size-5 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </aside>
          <section>
            <div className="flex items-center justify-between border-b border-border/70 pb-4">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-9 w-40 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 pt-6 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="space-y-3">
                  <Skeleton className="aspect-[4/5] rounded-[1.5rem]" />
                  <div className="flex justify-between gap-3">
                    <Skeleton className="h-3 w-14" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-6 w-4/5" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export function ShopPage({ products }: { products: Product[] }) {
  const [query, setQuery] = useState<ShopQuery>(readQuery);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category))].sort(),
    [products],
  );

  const change = (patch: Partial<ShopQuery>, resetPage = true) =>
    setQuery((current) => ({
      ...current,
      ...patch,
      page: resetPage ? 1 : (patch.page ?? current.page),
    }));

  const clear = () =>
    setQuery({
      search: "",
      categories: [],
      minPrice: "",
      maxPrice: "",
      rating: 0,
      availability: "all",
      sort: "featured",
      page: 1,
    });

  useEffect(() => {
    writeQuery(query);
  }, [query]);
  useEffect(() => {
    const sync = () => setQuery(readQuery());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const filtered = useMemo(() => {
    const needle = query.search.trim().toLowerCase();
    const min = Number(query.minPrice);
    const max = Number(query.maxPrice);
    const validRange = !(max > 0 && min > max);

    const result = products.filter((product) => {
      const matchesSearch =
        !needle ||
        [product.name, product.description, product.category].some((value) =>
          value.toLowerCase().includes(needle),
        );

      return (
        matchesSearch &&
        (!query.categories.length ||
          query.categories.includes(product.category)) &&
        (!min || product.price >= min) &&
        (!max || !validRange || product.price <= max) &&
        (!query.rating || product.rating >= query.rating) &&
        (query.availability === "all" ||
          (query.availability === "in-stock"
            ? product.stock > 0
            : product.stock === 0))
      );
    });
    return result.sort((a, b) =>
      query.sort === "price-asc"
        ? a.price - b.price
        : query.sort === "price-desc"
          ? b.price - a.price
          : query.sort === "rating-desc"
            ? b.rating - a.rating
            : query.sort === "name-asc"
              ? a.name.localeCompare(b.name)
              : query.sort === "name-desc"
                ? b.name.localeCompare(a.name)
                : products.indexOf(a) - products.indexOf(b),
    );
  }, [products, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE));
  const page = Math.min(query.page, pageCount);

  const shown = filtered.slice(
    (page - 1) * PRODUCTS_PER_PAGE,
    page * PRODUCTS_PER_PAGE,
  );

  const active =
    query.search ||
    query.categories.length ||
    query.minPrice ||
    query.maxPrice ||
    query.rating ||
    query.availability !== "all" ||
    query.sort !== "featured";

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <div
        aria-hidden="true"
        className="grain-texture pointer-events-none fixed inset-0 z-[65] opacity-[0.025] mix-blend-multiply"
      />
      <a
        href="#catalog"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[80] focus:rounded-full focus:bg-foreground focus:px-4 focus:py-2 focus:text-xs focus:text-background"
      >
        Skip to products
      </a>
      <Nav
        onSearch={() => document.getElementById("shop-search")?.focus()}
        onCart={() => setCartOpen(true)}
        onWishlist={() => setWishlistOpen(true)}
      />
      <main className="mx-auto max-w-6xl px-4 pt-14 pb-20 sm:px-6 md:px-8 lg:px-0">
        <header className="border-b border-border/70 pb-8">
          <p className="eyebrow text-clay">Shop</p>
          <h1 className="mt-4 max-w-xl font-serif text-4xl leading-none tracking-tight sm:text-5xl">
            Find something you&apos;ll love.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
            Explore our collection of thoughtfully selected products.
          </p>
        </header>
        <div className="relative mt-7">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="shop-search"
            className="h-12 rounded-full border-border bg-card pr-12 pl-11 text-sm"
            placeholder="Search products..."
            value={query.search}
            onChange={(e) => change({ search: e.target.value })}
          />
          {query.search && (
            <button
              type="button"
              onClick={() => change({ search: "" })}
              className="absolute top-1/2 right-3 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="mt-7 grid gap-8 lg:grid-cols-[190px_minmax(0,1fr)]">
          <aside className="hidden border-r border-border/70 pr-7 lg:block">
            <div className="mb-6 flex items-center justify-between">
              <p className="eyebrow">Filters</p>
              {active && (
                <button
                  type="button"
                  onClick={clear}
                  className="text-xs text-muted-foreground underline underline-offset-4"
                >
                  Clear all
                </button>
              )}
            </div>
            <FilterControls
              query={query}
              onChange={change}
              categories={categories}
            />
          </aside>
          <section id="catalog" className="min-w-0">
            <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-4">
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-border px-3 text-xs lg:hidden"
              >
                <Filter className="size-3.5" /> Filters
              </button>
              <p className="hidden text-xs text-muted-foreground sm:block">
                {filtered.length === 0
                  ? "No products"
                  : `Showing ${(page - 1) * PRODUCTS_PER_PAGE + 1}–${Math.min(page * PRODUCTS_PER_PAGE, filtered.length)} of ${filtered.length} products`}
              </p>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="hidden size-3.5 sm:block" />
                <span className="sr-only">Sort products</span>
                <Select
                  value={query.sort}
                  onValueChange={(value) => change({ sort: value as Sort })}
                >
                  <SelectTrigger className="h-9 w-40 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {active && (
              <div className="flex flex-wrap items-center gap-2 py-4">
                <span className="eyebrow mr-1 text-muted-foreground">
                  Filters
                </span>
                {query.search && (
                  <Chip
                    label={`“${query.search}”`}
                    onRemove={() => change({ search: "" })}
                  />
                )}
                {query.categories.map((category) => (
                  <Chip
                    key={category}
                    label={category}
                    onRemove={() =>
                      change({
                        categories: query.categories.filter(
                          (item) => item !== category,
                        ),
                      })
                    }
                  />
                ))}
                {(query.minPrice || query.maxPrice) && (
                  <Chip
                    label={`$${query.minPrice || "0"} – $${query.maxPrice || "∞"}`}
                    onRemove={() => change({ minPrice: "", maxPrice: "" })}
                  />
                )}
                {query.rating > 0 && (
                  <Chip
                    label={`${query.rating}★ & up`}
                    onRemove={() => change({ rating: 0 })}
                  />
                )}
                {query.availability !== "all" && (
                  <Chip
                    label={
                      query.availability === "in-stock"
                        ? "In stock"
                        : "Out of stock"
                    }
                    onRemove={() => change({ availability: "all" })}
                  />
                )}
                {query.sort !== "featured" && (
                  <Chip
                    label={
                      sortOptions.find(
                        ([value]) => value === query.sort,
                      )?.[1] ?? "Sort"
                    }
                    onRemove={() => change({ sort: "featured" })}
                  />
                )}
                <button
                  type="button"
                  onClick={clear}
                  className="ml-1 text-xs text-muted-foreground underline underline-offset-4"
                >
                  Clear all
                </button>
              </div>
            )}
            {shown.length ? (
              <div
                id="product-grid"
                className="grid scroll-mt-24 grid-cols-2 gap-x-3 gap-y-8 pt-6 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4"
              >
                <>
                  {shown.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </>
              </div>
            ) : (
              <div className="flex min-h-72 flex-col items-center justify-center border-b border-border/70 text-center">
                <p className="font-serif text-3xl">No products found.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try adjusting your search or filters.
                </p>
                <button
                  type="button"
                  onClick={clear}
                  className="mt-5 rounded-full border border-border px-4 py-2 text-xs hover:bg-muted"
                >
                  Clear all filters
                </button>
              </div>
            )}
            {filtered.length > PRODUCTS_PER_PAGE && (
              <Pagination
                page={page}
                pages={pageCount}
                onPage={(next) => {
                  change({ page: next }, false);
                  document
                    .getElementById("product-grid")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              />
            )}
          </section>
        </div>
      </main>
      <Footer />
      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filter products"
        eyebrow="Shop"
        side="left"
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={clear}
              className="h-10 flex-1 rounded-full border border-border text-xs"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="h-10 flex-1 rounded-full bg-foreground text-xs text-background"
            >
              View products
            </button>
          </div>
        }
      >
        <FilterControls
          query={query}
          onChange={change}
          categories={categories}
        />
      </Drawer>
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

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex h-7 items-center gap-1 rounded-full bg-muted px-3 text-xs">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="-mr-1 rounded-full p-0.5 hover:bg-foreground/10"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}

function Pagination({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}) {
  const list = Array.from({ length: pages }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Product pages"
      className="mt-12 flex items-center justify-center gap-1"
    >
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onPage(page - 1)}
        className="flex h-9 items-center gap-1 rounded-full px-3 text-xs disabled:opacity-35"
      >
        <ChevronLeft className="size-4" />{" "}
        <span className="hidden sm:inline">Previous</span>
      </button>
      {list.map((item) => (
        <button
          type="button"
          key={item}
          aria-current={page === item ? "page" : undefined}
          onClick={() => onPage(item)}
          className={`size-9 rounded-full text-xs ${page === item ? "bg-foreground text-background" : "hover:bg-muted"}`}
        >
          {item}
        </button>
      ))}
      <button
        type="button"
        disabled={page === pages}
        onClick={() => onPage(page + 1)}
        className="flex h-9 items-center gap-1 rounded-full px-3 text-xs disabled:opacity-35"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
