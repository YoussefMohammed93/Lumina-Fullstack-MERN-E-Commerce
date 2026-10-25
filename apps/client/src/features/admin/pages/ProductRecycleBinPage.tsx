import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CircleAlert,
  Package,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type { Product } from "@/types/product";
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
  AlertDialog,
  AlertDialogCancelButton,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type TrashedProduct = Omit<Product, "images" | "variants"> & {
  images: Array<{ url: string; alt: string }>;
  variants: Array<{ id: string; sku: string; isActive: boolean }>;
  trashedAt?: string;
};

function formatTrashedAt(value?: string) {
  if (!value) return "Moved to trash";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Moved to trash";
  return `Moved to trash ${new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)}`;
}

export function ProductRecycleBinPage() {
  const { csrfToken } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<TrashedProduct[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<TrashedProduct | null>(
    null,
  );
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    apiRequest<TrashedProduct[]>("/admin/products/trash")
      .then((items) => {
        if (!cancelled) setProducts(items);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Unable to load the trash.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) =>
      `${product.name} ${product.slug} ${product.category}`
        .toLowerCase()
        .includes(term),
    );
  }, [products, query]);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      setProducts(await apiRequest<TrashedProduct[]>("/admin/products/trash"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load the trash.");
    } finally {
      setLoading(false);
    }
  }

  async function restore(product: TrashedProduct) {
    if (!csrfToken) {
      setError("Your session has expired. Please sign in again.");
      return;
    }
    setBusyId(product.id);
    setError("");
    try {
      await authenticatedRequest(
        `/admin/products/${product.id}/restore`,
        csrfToken,
        { method: "PATCH" },
      );
      setProducts((items) => items.filter((item) => item.id !== product.id));
      toast("Product restored", `${product.name} is back in your product list.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not restore product.");
    } finally {
      setBusyId(null);
    }
  }

  async function permanentlyDelete(product: TrashedProduct) {
    if (!csrfToken) {
      setError("Your session has expired. Please sign in again.");
      return;
    }
    setBusyId(product.id);
    setError("");
    try {
      await authenticatedRequest(
        `/admin/products/${product.id}/permanent`,
        csrfToken,
        { method: "DELETE" },
      );
      setProducts((items) => items.filter((item) => item.id !== product.id));
      setProductToDelete(null);
      toast("Product permanently deleted", product.name);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not permanently delete product.",
      );
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <ProductRecycleBinPageSkeleton />;

  return (
    <div className="space-y-7">
      <PageHeader
        title="Product trash"
        description="Recover products you may still need, or permanently remove items you no longer want to keep."
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

      <Card className="gap-0 border-0 py-0 shadow-none ring-1 ring-foreground/8">
        <CardContent className="space-y-5 p-4 sm:p-5">
          <div className="flex flex-col gap-4">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by product name, category, or slug"
                aria-label="Search trashed products"
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
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <Trash2 className="size-4" strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-sm font-semibold">
                  {loading
                    ? "Loading trash…"
                    : `${products.length} ${products.length === 1 ? "product" : "products"} in trash`}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Deleted products are hidden from your shop.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <p className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                <AlertTriangle className="size-3.5 text-destructive" />
                Permanent deletion cannot be undone
              </p>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0 rounded-md"
                onClick={() => void refresh()}
                disabled={loading || Boolean(busyId)}
                aria-label="Refresh trash"
              >
                <RefreshCw className={loading ? "animate-spin" : ""} />
              </Button>
            </div>
          </div>
        </CardContent>
        <div className="divide-y divide-border/70">
          {loading &&
            Array.from({ length: 3 }, (_, index) => (
              <ProductRowSkeleton key={index} />
            ))}
          {!loading && visible.map((product) => (
            <article
              key={product.id}
              className="grid grid-cols-1 gap-4 p-4 transition-colors hover:bg-muted/20 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5"
            >
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
                    <h2 className="truncate text-sm font-semibold">
                      {product.name}
                    </h2>
                    <Badge
                      variant="destructive"
                      className="h-6 rounded-full px-2.5 text-[11px]"
                    >
                      In trash
                    </Badge>
                  </div>
                  <p className="mt-1.5 truncate text-xs text-muted-foreground">
                    {product.category}
                    <span className="mx-1.5 text-border">/</span>
                    <span className="font-mono text-[11px]">
                      {product.slug}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatTrashedAt(product.trashedAt)}
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-md"
                    onClick={() => void restore(product)}
                    disabled={Boolean(busyId)}
                  >
                    <RotateCcw />
                    {busyId === product.id ? "Restoring" : "Restore"}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="default"
                    className="rounded-md"
                    onClick={() => setProductToDelete(product)}
                    disabled={Boolean(busyId)}
                  >
                    <Trash2 />
                    <span className="hidden sm:inline">Delete permanently</span>
                    <span className="sm:hidden">Delete</span>
                  </Button>
                </div>
              </div>
            </article>
          ))}
          {!loading && visible.length === 0 && (products.length > 0 || !error) && (
            <div className="flex flex-col items-center px-5 py-14 text-center sm:py-16">
              <span className="mb-4 flex size-14 items-center justify-center rounded-full border bg-background text-clay shadow-sm">
                {query ? (
                  <Search className="size-6" strokeWidth={1.7} />
                ) : (
                  <Package className="size-6" strokeWidth={1.7} />
                )}
              </span>
              <p className="font-serif text-2xl">
                {query ? "No matching products" : "Trash is empty"}
              </p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                {query
                  ? "Try a different product name, category, or slug."
                  : "Products you move to trash will appear here. Drafts and archived products remain available in Drafts & archive."}
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

      <AlertDialog
        open={Boolean(productToDelete)}
        onOpenChange={(open) => !open && setProductToDelete(null)}
      >
        <AlertDialogContent className="rounded-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 font-sans">
              <AlertTriangle className="size-5 text-destructive" />
              Delete product permanently?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {productToDelete
                ? `${productToDelete.name} and its product data will be permanently deleted. This cannot be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancelButton disabled={Boolean(busyId)}>
              Cancel
            </AlertDialogCancelButton>
            <Button
              variant="destructive"
              disabled={!productToDelete || busyId === productToDelete.id}
              onClick={() =>
                productToDelete && void permanentlyDelete(productToDelete)
              }
            >
              {productToDelete && busyId === productToDelete.id
                ? "Deleting…"
                : "Delete permanently"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProductRecycleBinPageSkeleton() {
  return (
    <div className="space-y-7" aria-busy="true" aria-label="Loading trash">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-10 w-56 max-w-full md:h-12 md:w-64" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-96 max-w-full" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded-md sm:w-40" />
      </div>

      <Card className="gap-0 border-0 py-0 shadow-none ring-1 ring-foreground/8">
        <CardContent className="space-y-5 p-4 sm:p-5" aria-hidden="true">
          <Skeleton className="h-10 w-full" />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="hidden h-3 w-48 sm:block" />
              <Skeleton className="size-9 shrink-0" />
            </div>
          </div>
        </CardContent>
        <div className="divide-y divide-border/70" aria-hidden="true">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5"
            >
              <div className="flex min-w-0 items-center gap-4">
                <Skeleton className="size-16 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3 sm:justify-end sm:border-0 sm:pt-0">
                <div className="space-y-2 sm:mr-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-28" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
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
        <div className="h-3 w-1/4 rounded bg-muted" />
      </div>
      <div className="hidden w-24 space-y-2 sm:block">
        <div className="h-4 rounded bg-muted" />
        <div className="h-3 rounded bg-muted" />
      </div>
      <div className="hidden h-8 w-28 rounded bg-muted md:block" />
    </div>
  );
}
