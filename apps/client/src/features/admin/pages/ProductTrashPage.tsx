import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  FileEdit,
  Package,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import type { Product, ProductStatus } from "@/types/product";
import { apiRequest, authenticatedRequest } from "@/features/auth/auth-client";
import { useAuth } from "@/features/auth/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { formatPrice } from "@/services/api";
import { useToast } from "@/features/toast/toast-context";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type TrashProduct = Omit<Product, "images" | "variants"> & {
  images: Array<{ url: string; alt: string }>;
  variants: Array<{ id: string; sku: string; isActive: boolean }>;
};
type TrashFilter = "all" | "draft" | "archived";

const getStatus = (product: TrashProduct): ProductStatus =>
  product.status ?? "active";

export function ProductTrashPage() {
  const { csrfToken } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<TrashProduct[]>([]);
  const [filter, setFilter] = useState<TrashFilter>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    apiRequest<TrashProduct[]>("/admin/products")
      .then((items) => {
        if (!cancelled) setProducts(items);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load products.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(
    () => ({
      all: products.filter((product) => getStatus(product) !== "active").length,
      draft: products.filter((product) => getStatus(product) === "draft").length,
      archived: products.filter((product) => getStatus(product) === "archived")
        .length,
    }),
    [products],
  );
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter((product) => {
      const status = getStatus(product);
      const matchesStatus = status !== "active" && (filter === "all" || status === filter);
      const matchesQuery =
        !term ||
        `${product.name} ${product.slug} ${product.category}`
          .toLowerCase()
          .includes(term);
      return matchesStatus && matchesQuery;
    });
  }, [products, filter, query]);

  async function changeStatus(product: TrashProduct, status: ProductStatus) {
    if (!csrfToken) {
      setError("Your session has expired. Please sign in again.");
      return;
    }
    setBusyId(product.id);
    setError("");
    try {
      const updated = await authenticatedRequest<TrashProduct>(
        `/admin/products/${product.id}/status`,
        csrfToken,
        { method: "PATCH", body: JSON.stringify({ status }) },
      );
      setProducts((items) =>
        items.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast(
        status === "active"
          ? "Product published"
          : status === "archived"
            ? "Product archived"
            : "Product saved as draft",
        product.name,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update product status.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      setProducts(await apiRequest<TrashProduct[]>("/admin/products"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <ProductDraftsPageSkeleton />;

  return (
    <TooltipProvider delay={500}>
      <div className="space-y-7">
        <PageHeader
          title="Drafts & archive"
          description="Pick up where you left off with unpublished products, or bring archived pieces back to your shop."
          action={
            <Button asChild className="w-full rounded-md sm:w-auto">
              <a href="/admin/products">
                <Package />
                Manage products
                <ArrowUpRight />
              </a>
            </Button>
          }
        />

        {error && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="flex items-start gap-2">
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              {error}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start border-destructive/20 text-destructive hover:bg-destructive/10 sm:self-auto"
              onClick={() => void refresh()}
              disabled={loading}
            >
              <RefreshCw className={loading ? "animate-spin" : ""} />
              Try again
            </Button>
          </div>
        )}

        <section
          aria-label="Drafts and archive overview"
          aria-busy={loading}
          className="grid gap-3 sm:grid-cols-3"
        >
          <StatusSummary
            label="Products to review"
            value={loading ? "—" : counts.all}
            detail="Across drafts and archive"
            icon={Package}
          />
          <StatusSummary
            label="Drafts"
            value={loading ? "—" : counts.draft}
            detail="Not published yet"
            icon={FileEdit}
            emphasis
          />
          <StatusSummary
            label="Archived"
            value={loading ? "—" : counts.archived}
            detail="Hidden from your shop"
            icon={Archive}
          />
        </section>

        <Card className="gap-0 border-0 py-0 shadow-none ring-1 ring-foreground/8">
          <CardContent className="space-y-5 p-4 sm:p-5">
            <div className="flex flex-col gap-4">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by product name, category, or slug"
                  aria-label="Search drafts and archived products"
                  className="h-10 bg-background pl-9 pr-10"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 border-b">
                <div
                  className="flex min-w-0 items-center gap-1 overflow-x-auto"
                  role="group"
                  aria-label="Filter products"
                >
                  {(
                    [
                      ["all", "All"],
                      ["draft", "Drafts"],
                      ["archived", "Archived"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFilter(value)}
                      aria-pressed={filter === value}
                      className={`inline-flex h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm transition-colors ${
                        filter === value
                          ? "border-clay font-medium text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {label}
                      <span
                        className={`tabular rounded-full px-1.5 py-0.5 text-[11px] ${
                          filter === value
                            ? "bg-clay/10 text-clay"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {counts[value]}
                      </span>
                    </button>
                  ))}
                </div>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="mb-3 shrink-0 rounded-md"
                        onClick={() => void refresh()}
                        disabled={loading}
                        aria-label="Refresh drafts and archived products"
                      >
                        <RefreshCw
                          className={loading ? "animate-spin" : ""}
                        />
                      </Button>
                    }
                  />
                  <TooltipContent>Refresh products</TooltipContent>
                </Tooltip>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className="font-medium">
                {loading
                  ? "Loading products…"
                  : `${visible.length} ${visible.length === 1 ? "product" : "products"}`}
              </p>
              <p className="text-xs text-muted-foreground" aria-live="polite">
                {filter === "all"
                  ? "Drafts are private · Archived products are hidden from your shop"
                  : filter === "draft"
                    ? "Only you can see products saved as drafts"
                    : "Archived products are not visible to customers"}
              </p>
            </div>
          </CardContent>
          <div className="divide-y divide-border/70">
            {loading &&
              Array.from({ length: 3 }, (_, index) => (
                <ProductRowSkeleton key={index} />
              ))}
            {!loading &&
              visible.map((product) => (
                <TrashProductRow
                  key={product.id}
                  product={product}
                  busy={busyId === product.id}
                  onPublish={() => void changeStatus(product, "active")}
                  onRestore={() => void changeStatus(product, "active")}
                  onArchive={() => void changeStatus(product, "archived")}
                />
              ))}
            {!loading &&
              visible.length === 0 &&
              (products.length > 0 || !error) && (
                <div className="flex flex-col items-center px-5 py-14 text-center sm:py-16">
                  <span className="mb-4 flex size-14 items-center justify-center rounded-full border bg-background text-clay shadow-none">
                    {filter === "all" && !query ? (
                      <CheckCircle2 className="size-6" strokeWidth={1.7} />
                    ) : (
                      <Search className="size-6" strokeWidth={1.7} />
                    )}
                  </span>
                  <p className="font-serif text-2xl">
                    {query
                      ? "No matching products"
                      : filter === "draft"
                        ? "No drafts yet"
                        : filter === "archived"
                          ? "Nothing in the archive"
                          : "All caught up"}
                  </p>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                    {query
                      ? "Try a different product name, category, or slug."
                      : filter === "all"
                        ? "Your unpublished and archived products will appear here when you need them."
                        : `Products saved as ${filter} will appear here.`}
                  </p>
                  {query ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-5 rounded-md"
                      onClick={() => setQuery("")}
                    >
                      Clear search
                    </Button>
                  ) : filter !== "all" ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-5 rounded-md"
                      onClick={() => setFilter("all")}
                    >
                      View all products
                    </Button>
                  ) : (
                    <Button asChild className="mt-5 rounded-md">
                      <a href="/admin/products">
                        <Package />
                        Manage products
                      </a>
                    </Button>
                  )}
                </div>
              )}
          </div>
        </Card>
      </div>
    </TooltipProvider>
  );
}

function ProductDraftsPageSkeleton() {
  return (
    <div className="space-y-7" aria-busy="true" aria-label="Loading drafts">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-10 w-64 max-w-full md:h-12 md:w-80" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-96 max-w-full" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded-md sm:w-40" />
      </div>

      <section className="grid gap-3 sm:grid-cols-3" aria-hidden="true">
        {Array.from({ length: 3 }, (_, index) => (
          <Card
            key={index}
            className="gap-0 border-0 py-4 shadow-none ring-1 ring-foreground/8"
          >
            <CardContent className="flex items-start justify-between gap-2">
              <div className="space-y-3">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="size-10 rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="gap-0 border-0 py-0 shadow-none ring-1 ring-foreground/8">
        <CardContent className="space-y-5 p-4 sm:p-5" aria-hidden="true">
          <Skeleton className="h-10 w-full" />
          <div className="flex items-center justify-between gap-3 border-b">
            <div className="flex gap-2 pb-3">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="mb-3 size-9 shrink-0" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-72 max-w-full" />
          </div>
        </CardContent>
        <div className="divide-y divide-border/70" aria-hidden="true">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 sm:px-5"
            >
              <Skeleton className="size-16 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="hidden h-8 w-24 sm:block" />
              <Skeleton className="hidden h-8 w-28 md:block" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function StatusSummary({
  label,
  value,
  detail,
  icon: Icon,
  emphasis = false,
}: {
  label: string;
  value: number | string;
  detail: string;
  icon: typeof Package;
  emphasis?: boolean;
}) {
  return (
    <Card className="gap-0 border-0 py-4 shadow-none ring-1 ring-foreground/8">
      <CardContent className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="tabular mt-3 text-3xl leading-none font-semibold tracking-tight">
            {value}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
        </div>
        <span
          className={`flex size-10 items-center justify-center rounded-xl ${
            emphasis
              ? "bg-clay/10 text-clay"
              : "bg-secondary text-muted-foreground"
          }`}
        >
          <Icon className="size-4" strokeWidth={1.8} />
        </span>
      </CardContent>
    </Card>
  );
}

function ProductRowSkeleton() {
  return (
    <div
      className="flex animate-pulse items-center gap-4 p-4 sm:px-5"
      aria-hidden="true"
    >
      <div className="size-16 shrink-0 rounded-lg bg-muted" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-1/3 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
      </div>
      <div className="hidden w-24 space-y-2 sm:block">
        <div className="h-4 rounded bg-muted" />
        <div className="h-3 rounded bg-muted" />
      </div>
      <div className="hidden h-8 w-28 rounded bg-muted md:block" />
    </div>
  );
}

function TrashProductRow({
  product,
  busy,
  onPublish,
  onRestore,
  onArchive,
}: {
  product: TrashProduct;
  busy: boolean;
  onPublish: () => void;
  onRestore: () => void;
  onArchive: () => void;
}) {
  const status = getStatus(product);
  return (
    <article className="grid grid-cols-1 gap-4 p-4 transition-colors hover:bg-muted/20 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5">
      <div className="flex min-w-0 items-center gap-4">
        <div className="size-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
          {product.images[0] ? (
            <img
              src={product.images[0].url}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-muted-foreground/70">
              <Package className="size-6" strokeWidth={1.5} />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-sm font-semibold">{product.name}</h2>
            <Badge
              variant="secondary"
              className={`h-6 rounded-full border px-2.5 text-[11px] capitalize ${
                status === "draft"
                  ? "border-clay/15 bg-clay/10 text-clay"
                  : "border-border/80 bg-secondary text-muted-foreground"
              }`}
            >
              {status}
            </Badge>
          </div>
          <p className="mt-1.5 truncate text-xs text-muted-foreground">
            {product.category}
            <span className="mx-1.5 text-border">/</span>
            <span className="font-mono text-[11px]">{product.slug}</span>
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3 sm:justify-end sm:border-0 sm:pt-0">
        <div className="min-w-24 text-sm sm:mr-2">
          <p className="font-medium">{formatPrice(product.price)}</p>
          <p className="text-xs text-muted-foreground">
            {product.stock} in stock
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {status === "draft" ? (
            <>
              <Button
                asChild
                variant="outline"
                size="default"
                className="rounded-md"
              >
                <a
                  href={`/admin/products?edit=${encodeURIComponent(product.id)}`}
                >
                  <FileEdit />
                  Edit
                </a>
              </Button>
              <Button
                type="button"
                size="default"
                className="rounded-md"
                onClick={onPublish}
                disabled={busy}
              >
                <CheckCircle2 />
                {busy ? "Publishing" : "Publish"}
              </Button>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      className="rounded-full text-muted-foreground hover:text-foreground"
                      onClick={onArchive}
                      disabled={busy}
                      aria-label={`Archive ${product.name}`}
                    >
                      <Archive />
                    </Button>
                  }
                />
                <TooltipContent>Move to archive</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-md"
              onClick={onRestore}
              disabled={busy}
            >
              <ArchiveRestore />
              {busy ? "Restoring" : "Restore to shop"}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
