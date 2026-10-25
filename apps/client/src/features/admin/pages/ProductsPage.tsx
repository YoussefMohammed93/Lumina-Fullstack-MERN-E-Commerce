import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Archive,
  ArchiveRestore,
  ArrowDownUp,
  CheckCircle2,
  CircleAlert,
  ImagePlus,
  LayoutGrid,
  List,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { Category, Product, ProductStatus } from "@/types/product";
import { apiRequest, authenticatedRequest } from "@/features/auth/auth-client";
import { useAuth } from "@/features/auth/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { formatPrice } from "@/services/api";
import { useToast } from "@/features/toast/toast-context";
import { Skeleton } from "@/components/ui/skeleton";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogCancelButton,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ImageItem = {
  url: string;
  publicId?: string;
  alt: string;
  sortOrder: number;
};
type DraftVariant = {
  id: string;
  sku: string;
  color: string;
  size: string;
  price: number;
  compareAtPrice: number | "";
  stock: number;
  isActive: boolean;
};
type Draft = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  materials: string;
  dimensions: string;
  status: ProductStatus;
  cashOnDeliveryAvailable: boolean;
  images: ImageItem[];
  variants: DraftVariant[];
};
type AdminProduct = Omit<Product, "images" | "variants"> & {
  images: ImageItem[];
  variants: Array<{
    id: string;
    sku: string;
    attributes: Record<string, string>;
    price: number;
    compareAtPrice?: number;
    stock: number;
    isActive: boolean;
  }>;
};
type ProductFilter = "all" | "active" | "draft" | "archived";
type ProductSort = "newest" | "name" | "price-low" | "price-high" | "stock";
type ProductView = "list" | "grid";

const productFormSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1, "Enter a product name.").max(160),
    slug: z
      .string()
      .trim()
      .min(1, "Enter a product URL slug.")
      .max(160)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Use lowercase letters, numbers, and single hyphens.",
      ),
    description: z
      .string()
      .trim()
      .min(1, "Enter a product description.")
      .max(5000),
    categoryId: z.string().min(1, "Choose a product category."),
    materials: z.string().max(500, "Materials must be 500 characters or fewer."),
    dimensions: z
      .string()
      .max(300, "Dimensions must be 300 characters or fewer."),
    status: z.enum(["draft", "active", "archived"]),
    cashOnDeliveryAvailable: z.boolean(),
    images: z.array(
      z.object({
        url: z.string().trim().url("Enter a valid image URL."),
        publicId: z.string().optional(),
        alt: z.string(),
        sortOrder: z.number().int().nonnegative(),
      }),
    ),
    variants: z
      .array(
        z.object({
          id: z.string(),
          sku: z.string().trim().min(1, "Enter a SKU."),
          color: z.string(),
          size: z.string(),
          price: z
            .number()
            .finite()
            .nonnegative("Price cannot be negative.")
            .refine(
              (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8,
              "Use no more than 2 decimal places.",
            ),
          compareAtPrice: z.union([
            z.literal(""),
            z.number().finite().nonnegative("Compare-at price cannot be negative."),
          ]),
          stock: z.number().int("Stock must be a whole number.").nonnegative(),
          isActive: z.boolean(),
        }),
      )
      .min(1, "Add at least one product variant.")
      .superRefine((variants, context) => {
        const seen = new Set<string>();
        variants.forEach((item, index) => {
          const sku = item.sku.trim().toLowerCase();
          if (!sku || !seen.has(sku)) {
            seen.add(sku);
            return;
          }
          context.addIssue({
            code: "custom",
            path: [index, "sku"],
            message: "Each variant must have a unique SKU.",
          });
        });
      }),
  })
  .strict();

const productStatus = (product: AdminProduct) => product.status ?? "active";
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
const variant = (): DraftVariant => ({
  id: crypto.randomUUID(),
  sku: "",
  color: "",
  size: "",
  price: 0,
  compareAtPrice: "",
  stock: 0,
  isActive: true,
});
const blank = (): Draft => ({
  name: "",
  slug: "",
  description: "",
  categoryId: "",
  materials: "",
  dimensions: "",
  status: "draft",
  cashOnDeliveryAvailable: true,
  images: [],
  variants: [variant()],
});

function asImage(value: unknown, index: number): ImageItem | null {
  if (typeof value === "string")
    return value ? { url: value, alt: "", sortOrder: index } : null;
  if (
    value &&
    typeof value === "object" &&
    typeof (value as ImageItem).url === "string"
  )
    return { ...(value as ImageItem), sortOrder: index };
  return null;
}

function productDraft(product: AdminProduct): Draft {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    categoryId: product.categoryId ?? "",
    materials: product.materials ?? "",
    dimensions: product.dimensions ?? "",
    status: productStatus(product),
    cashOnDeliveryAvailable: product.cashOnDeliveryAvailable !== false,
    images: product.images
      .map(asImage)
      .filter((image): image is ImageItem => Boolean(image)),
    variants: product.variants.map((item) => ({
      id: item.id,
      sku: item.sku,
      color: item.attributes?.Color ?? "",
      size: item.attributes?.Size ?? "",
      price: item.price / 100,
      compareAtPrice: item.compareAtPrice ? item.compareAtPrice / 100 : "",
      stock: item.stock,
      isActive: item.isActive,
    })),
  };
}

export function ProductsPage() {
  const { csrfToken } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState(
    () => new URLSearchParams(window.location.search).get("search") ?? "",
  );
  const [filter, setFilter] = useState<ProductFilter>("all");
  const [sort, setSort] = useState<ProductSort>("newest");
  const [view, setView] = useState<ProductView>("list");
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(
    null,
  );
  const [productToTrash, setProductToTrash] = useState<AdminProduct | null>(
    null,
  );
  const load = async () => {
    setError("");
    try {
      const [items, categoryItems] = await Promise.all([
        apiRequest<AdminProduct[]>("/admin/products"),
        apiRequest<Category[]>("/admin/categories"),
      ]);
      setProducts(items);
      setCategories(categoryItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load products.");
    } finally {
      setLoading(false);
    }
  };
  const refresh = () => {
    setLoading(true);
    void load();
  };
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiRequest<AdminProduct[]>("/admin/products"),
      apiRequest<Category[]>("/admin/categories"),
    ])
      .then(([items, categoryItems]) => {
        if (cancelled) return;
        setProducts(items);
        setCategories(categoryItems);
        const productToEditId = new URLSearchParams(
          window.location.search,
        ).get("edit");
        if (!productToEditId) return;
        const product = items.find((item) => item.id === productToEditId);
        if (product) setDraft(productDraft(product));
        else setError("That product could not be found.");
        const params = new URLSearchParams(window.location.search);
        params.delete("edit");
        const search = params.toString();
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${search ? `?${search}` : ""}`,
        );
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
      all: products.length,
      active: products.filter((product) => productStatus(product) === "active")
        .length,
      draft: products.filter((product) => productStatus(product) === "draft")
        .length,
      archived: products.filter(
        (product) => productStatus(product) === "archived",
      ).length,
      lowStock: products.filter(
        (product) =>
          productStatus(product) === "active" && product.stock <= 5,
      ).length,
    }),
    [products],
  );
  const visible = useMemo(
    () => {
      const term = query.trim().toLowerCase();
      return products
        .filter((product) => filter === "all" || productStatus(product) === filter)
        .filter((product) => {
          if (!term) return true;
          const variantSearch = product.variants
            .map((item) => `${item.sku} ${Object.values(item.attributes).join(" ")}`)
            .join(" ");
          return `${product.name} ${product.category} ${product.slug} ${variantSearch}`
            .toLowerCase()
            .includes(term);
        })
        .sort((a, b) => {
          switch (sort) {
            case "name":
              return a.name.localeCompare(b.name);
            case "price-low":
              return a.price - b.price;
            case "price-high":
              return b.price - a.price;
            case "stock":
              return a.stock - b.stock;
            default:
              return 0;
          }
        });
    },
    [products, query, filter, sort],
  );
  if (loading) return <ProductsPageSkeleton view={view} />;
  const edit = (product?: AdminProduct) => {
    setError("");
    setDraft(product ? productDraft(product) : blank());
  };
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft || !csrfToken) return;
    setSaving(true);
    setError("");
    try {
      const isUpdate = Boolean(draft.id);
      const body = {
        ...draft,
        categoryId: draft.categoryId,
        images: draft.images.map((image, sortOrder) => ({
          ...image,
          sortOrder,
        })),
        variants: draft.variants.map(
          ({ color, size, price, compareAtPrice, ...item }) => ({
            ...item,
            price: Math.round(price * 100),
            compareAtPrice:
              compareAtPrice === ""
                ? undefined
                : Math.round(Number(compareAtPrice) * 100),
            attributes: {
              ...(color.trim() ? { Color: color.trim() } : {}),
              ...(size.trim() ? { Size: size.trim() } : {}),
            },
          }),
        ),
      };
      await authenticatedRequest(
        draft.id ? `/admin/products/${draft.id}` : "/admin/products",
        csrfToken,
        { method: draft.id ? "PATCH" : "POST", body: JSON.stringify(body) },
      );
      setDraft(null);
      setLoading(true);
      await load();
      toast(isUpdate ? "Product updated" : "Product added", draft.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save product.");
    } finally {
      setSaving(false);
    }
  }
  async function archive(product: AdminProduct) {
    if (!csrfToken) {
      setError("Your session has expired. Please sign in again.");
      return;
    }
    setUpdatingProductId(product.id);
    setError("");
    try {
      const archivedProduct = await authenticatedRequest<AdminProduct>(
        `/admin/products/${product.id}/status`,
        csrfToken,
        { method: "PATCH", body: JSON.stringify({ status: "archived" }) },
      );
      setProducts((current) =>
        current.map((item) =>
          item.id === archivedProduct.id ? archivedProduct : item,
        ),
      );
      toast("Product archived", `${product.name} is hidden from the shop.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not archive product.",
      );
    } finally {
      setUpdatingProductId(null);
    }
  }
  async function moveToTrash(product: AdminProduct) {
    if (!csrfToken) {
      setError("Your session has expired. Please sign in again.");
      return;
    }
    setUpdatingProductId(product.id);
    setError("");
    try {
      await authenticatedRequest(
        `/admin/products/${product.id}`,
        csrfToken,
        { method: "DELETE" },
      );
      setProducts((current) =>
        current.filter((item) => item.id !== product.id),
      );
      setProductToTrash(null);
      toast("Product moved to trash", `${product.name} can be restored later.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not move product to trash.");
    } finally {
      setUpdatingProductId(null);
    }
  }
  async function restore(product: AdminProduct) {
    if (!csrfToken) {
      setError("Your session has expired. Please sign in again.");
      return;
    }
    setUpdatingProductId(product.id);
    setError("");
    try {
      const unarchivedProduct = await authenticatedRequest<AdminProduct>(
        `/admin/products/${product.id}/unarchive`,
        csrfToken,
        { method: "PATCH" },
      );
      setProducts((current) =>
        current.map((item) =>
          item.id === unarchivedProduct.id ? unarchivedProduct : item,
        ),
      );
      toast("Product unarchived", `${product.name} is active in the shop again.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not unarchive product.",
      );
    } finally {
      setUpdatingProductId(null);
    }
  }
  return (
    <TooltipProvider delay={500}>
      <div className="space-y-6 sm:space-y-7">
      <PageHeader
        title="Products"
        description="Manage products, images, pricing, variants, and inventory."
        action={
          <Button className="w-full rounded-md sm:w-auto" onClick={() => edit()}>
            <Plus />
            Add product
          </Button>
        }
      />
      {error && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <section
        aria-label="Product overview"
        className="grid grid-cols-2 gap-3 xl:grid-cols-4"
      >
        <SummaryCard
          label="Total products"
          value={counts.all}
          detail="Across all statuses"
          icon={Package}
          tone="text-primary bg-primary/10 !rounded-full"
        />
        <SummaryCard
          label="Active"
          value={counts.active}
          detail="Visible in your shop"
          icon={CheckCircle2}
          tone="text-emerald-700 bg-emerald-500/10 !rounded-full"
        />
        <SummaryCard
          label="Low inventory"
          value={counts.lowStock}
          detail="Active products · 5 or fewer"
          icon={CircleAlert}
          tone="text-amber-700 bg-amber-500/10 !rounded-full"
        />
        <SummaryCard
          label="Drafts"
          value={counts.draft}
          detail="Not published yet"
          icon={Pencil}
          tone="text-muted-foreground bg-muted !rounded-full"
        />
      </section>

      <Card className="gap-4 border-0 py-4 shadow-none ring-1 ring-foreground/8 sm:gap-5 sm:py-5">
        <CardContent className="space-y-4 px-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="bg-background pl-9 pr-9 h-10"
                placeholder="Search by product, SKU, color, or size"
                aria-label="Search products"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <ArrowDownUp className="size-4 shrink-0 text-muted-foreground" />
              <Select
                value={sort}
                onValueChange={(value) => setSort(value as ProductSort)}
              >
                <SelectTrigger
                  className="h-9 min-w-0 rounded-md bg-background px-3 sm:w-48"
                  aria-label="Sort products"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  <SelectItem className="rounded-md" value="newest">
                    Default order
                  </SelectItem>
                  <SelectItem className="rounded-md" value="name">
                    Name: A to Z
                  </SelectItem>
                  <SelectItem className="rounded-md" value="price-low">
                    Price: low to high
                  </SelectItem>
                  <SelectItem className="rounded-md" value="price-high">
                    Price: high to low
                  </SelectItem>
                  <SelectItem className="rounded-md" value="stock">
                    Stock: low to high
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div
              className="flex shrink-0 items-center gap-1 rounded-md border p-0.5"
              role="group"
              aria-label="Product layout"
            >
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant={view === "list" ? "secondary" : "ghost"}
                      size="icon"
                      className="rounded-md"
                      onClick={() => setView("list")}
                      aria-label="List view"
                      aria-pressed={view === "list"}
                    >
                      <List />
                    </Button>
                  }
                />
                <TooltipContent>List view</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant={view === "grid" ? "secondary" : "ghost"}
                      size="icon"
                      className="rounded-md"
                      onClick={() => setView("grid")}
                      aria-label="Grid view"
                      aria-pressed={view === "grid"}
                    >
                      <LayoutGrid />
                    </Button>
                  }
                />
                <TooltipContent>Grid view</TooltipContent>
              </Tooltip>
            </div>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    className="hidden rounded-md sm:inline-flex size-10"
                    onClick={refresh}
                    disabled={loading}
                    aria-label="Refresh products"
                  >
                    <RefreshCw className={loading ? "animate-spin" : ""} />
                  </Button>
                }
              />
              <TooltipContent>Refresh products</TooltipContent>
            </Tooltip>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {counts[filter]}
              </span>{" "}
              {filter === "all" ? "products" : filter}
            </p>
            <Select
              value={filter}
              onValueChange={(value) => setFilter(value as ProductFilter)}
            >
              <SelectTrigger
                className="h-9 w-full rounded-md bg-background px-3 sm:w-52"
                aria-label="Filter products by status"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                <SelectItem className="rounded-md" value="all">
                  All products
                </SelectItem>
                <SelectItem className="rounded-md" value="active">
                  Active 
                </SelectItem>
                <SelectItem className="rounded-md" value="draft">
                  Drafts 
                </SelectItem>
                <SelectItem className="rounded-md" value="archived">
                  Archived 
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden rounded-md border-0 py-0 shadow-none ring-1 ring-foreground/8">
        <CardContent className="p-0">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
            <p className="text-sm font-medium">
              {loading
                ? "Loading products…"
                : `${visible.length} ${visible.length === 1 ? "product" : "products"}`}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="sm:hidden"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw className={loading ? "animate-spin" : ""} />
              Refresh
            </Button>
          </div>
          {view === "list" && visible.length > 0 && (
            <div className="products-table-header hidden items-center gap-3 border-b bg-muted/25 px-5 py-3 text-xs font-medium text-muted-foreground lg:grid">
              <span className="products-cell-identity">Product</span>
              <span className="products-cell-price">Price</span>
              <span className="products-cell-stock">Stock</span>
              <span className="products-cell-statistics">Statistics</span>
              <span className="products-cell-actions">Actions</span>
            </div>
          )}
          <div
            className={
              view === "grid"
                ? "products-card-grid"
                : "divide-y divide-border/70"
            }
          >
            {visible.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                view={view}
                onEdit={() => edit(product)}
                onArchive={() => void archive(product)}
                onTrash={() => setProductToTrash(product)}
                onRestore={() => void restore(product)}
                busy={Boolean(updatingProductId)}
              />
            ))}
            {!loading && visible.length === 0 && (
              <div className="col-span-full flex flex-col items-center px-5 py-12 text-center">
                <span className="mb-3 flex size-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Search className="size-5" />
                </span>
                <p className="font-medium">
                  {products.length === 0 ? "No products yet" : "No matching products"}
                </p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  {products.length === 0
                    ? "Add your first product to start building your catalog."
                    : "Try another search or clear your filters to see more products."}
                </p>
                {products.length === 0 ? (
                  <Button className="mt-4" onClick={() => edit()}>
                    <Plus />
                    Add product
                  </Button>
                ) : (
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => {
                      setQuery("");
                      setFilter("all");
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {draft && (
        <ProductDialog
          draft={draft}
          categories={categories}
          saving={saving}
          error={error}
          onChange={setDraft}
          onClose={() => setDraft(null)}
          onSubmit={save}
        />
      )}
      <AlertDialog
        open={Boolean(productToTrash)}
        onOpenChange={(open) => !open && setProductToTrash(null)}
      >
        <AlertDialogContent className="rounded-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-sans">Move product to trash?</AlertDialogTitle>
            <AlertDialogDescription>
              {productToTrash
                ? `${productToTrash.name} will be hidden from your product list. You can restore it from Trash later.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancelButton
              disabled={
                Boolean(productToTrash) &&
                updatingProductId === productToTrash?.id
              }
            >
              Cancel
            </AlertDialogCancelButton>
            <Button
              variant="destructive"
              disabled={
                Boolean(productToTrash) &&
                updatingProductId === productToTrash?.id
              }
              onClick={() => productToTrash && void moveToTrash(productToTrash)}
            >
              {productToTrash && updatingProductId === productToTrash.id
                ? "Moving…"
                : "Move to trash"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </TooltipProvider>
  );
}

function ProductsPageSkeleton({ view }: { view: ProductView }) {
  return (
    <div
      className="space-y-6 sm:space-y-7"
      aria-busy="true"
      aria-label="Loading products"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-10 w-48 md:h-12 md:w-56" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-72 max-w-full" />
            <Skeleton className="h-4 w-56 max-w-full" />
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded-md sm:w-36" />
      </div>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <Card
            key={index}
            className="gap-3 rounded-md border-0 py-4 shadow-none ring-1 ring-foreground/8 sm:py-5"
          > 
            <CardContent className="flex items-start justify-between gap-2 px-4 sm:px-5">
              <div className="space-y-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-14" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="size-10 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="gap-4 border-0 py-4 shadow-none ring-1 ring-foreground/8 sm:gap-5 sm:py-5">
        <CardContent className="space-y-4 px-4 sm:px-5" aria-hidden="true">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Skeleton className="h-10 min-w-0 flex-1" />
            <Skeleton className="h-10 w-full sm:w-48" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="hidden size-10 sm:block" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-full sm:w-52" />
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden rounded-md border-0 py-0 shadow-none ring-1 ring-foreground/8">
        <CardContent className="p-0" aria-hidden="true">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20 sm:hidden" />
          </div>
          {view === "list" && (
            <div className="products-table-header hidden gap-3 border-b bg-muted/25 px-5 py-3 lg:grid">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-3 w-16" />
              ))}
            </div>
          )}
          <div
            className={
              view === "grid"
                ? "products-card-grid"
                : "divide-y divide-border/70"
            }
          >
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className={
                  view === "grid"
                    ? "space-y-4 rounded-md border p-4"
                    : "products-table-row items-center gap-x-3 gap-y-2 p-4 sm:px-5"
                }
              >
                {view === "grid" ? (
                  <>
                    <Skeleton className="aspect-square w-full" />
                    <div className="min-w-0 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="products-cell-identity flex min-w-0 items-center gap-3">
                      <Skeleton className="size-14 shrink-0" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                    <div className="products-cell-price space-y-2">
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="products-cell-stock h-8 w-16" />
                    <Skeleton className="products-cell-statistics h-8 w-24" />
                    <Skeleton className="products-cell-actions h-8 w-20" />
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  icon: typeof Package;
  tone: string;
}) {
  return (
    <Card className="gap-3 rounded-md border-0 py-4 shadow-none ring-1 ring-foreground/8 sm:py-5">
      <CardContent className="flex items-start justify-between gap-2 px-4 sm:px-5">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground sm:text-sm">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {value.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] leading-4 text-muted-foreground sm:text-xs">
            {detail}
          </p>
        </div>
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-md sm:size-10 ${tone}`}>
          <Icon className="size-4 sm:size-5" />
        </span>
      </CardContent>
    </Card>
  );
}

function ProductRow({
  product,
  view,
  onEdit,
  onArchive,
  onTrash,
  onRestore,
  busy,
}: {
  product: AdminProduct;
  view: ProductView;
  onEdit: () => void;
  onArchive: () => void;
  onTrash: () => void;
  onRestore: () => void;
  busy: boolean;
}) {
  const status = productStatus(product);
  const stockTone =
    product.stock <= 0
      ? "text-destructive"
      : product.stock <= 5
        ? "text-amber-700"
        : "text-emerald-700";
  const stockLabel =
    product.stock <= 0
      ? "Out of stock"
      : product.stock <= 5
        ? "Low stock"
        : "In stock";
  const statusTone =
    status === "active"
      ? "bg-emerald-500/10 text-emerald-700"
      : status === "archived"
        ? "bg-muted text-muted-foreground"
        : "bg-amber-500/10 text-amber-700";
  const rating = Number.isFinite(product.rating)
    ? Math.min(5, Math.max(0, product.rating))
    : 0;
  const statistics = (
    <div className="products-cell-statistics min-w-0">
      <p className="text-[11px] text-muted-foreground lg:hidden">Statistics</p>
      <p className="mt-0.5 text-sm font-medium">
        {rating > 0 ? `${rating.toFixed(1)} / 5` : "No rating"}
      </p>
      <div className="mt-1 flex items-center gap-2">
        <div
          className="h-1.5 w-20 overflow-hidden rounded-md bg-muted"
          role="img"
          aria-label={`${rating.toFixed(1)} out of 5 stars`}
        >
          <div
            className="h-full rounded-md bg-clay"
            style={{ width: `${(rating / 5) * 100}%` }}
          />
        </div>
        <span className="text-[11px] text-muted-foreground">
          {product.reviewCount} reviews
        </span>
      </div>
    </div>
  );

  const actions = (
    <div className="flex shrink-0 items-center justify-end gap-1">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="default"
              className="rounded-full !size-10"
              onClick={onEdit}
              disabled={busy}
              aria-label={`Edit ${product.name}`}
            >
              <Pencil />
            </Button>
          }
        />
        <TooltipContent>Edit product</TooltipContent>
      </Tooltip>
      {status === "archived" ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-full !h-10 !w-10"
                onClick={onRestore}
                disabled={busy}
                aria-label={`Unarchive ${product.name}`}
              >
                <ArchiveRestore className="text-emerald-700" />
              </Button>
            }
          />
          <TooltipContent>
            {busy ? "Unarchiving product…" : "Unarchive product"}
          </TooltipContent>
        </Tooltip>
      ) : (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="default"
                className="rounded-full !size-10"
                onClick={onArchive}
                disabled={busy}
                aria-label={`Archive ${product.name}`}
              >
                <Archive className="text-destructive" />
              </Button>
            }
          />
          <TooltipContent>
            {busy ? "Archiving product…" : "Archive product"}
          </TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="default"
              className="rounded-full !h-10 !w-10"
              onClick={onTrash}
              disabled={busy}
              aria-label={`Move ${product.name} to trash`}
            >
              <Trash2 className="text-destructive" />
            </Button>
          }
        />
        <TooltipContent>Move to trash</TooltipContent>
      </Tooltip>
    </div>
  );

  const identity = (
    <div className="products-cell-identity flex min-w-0 items-center gap-3">
      <div className="size-14 shrink-0 overflow-hidden rounded-md bg-muted sm:size-16">
        {product.images[0] ? (
          <img
            src={product.images[0].url}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-muted-foreground">
            <Package className="size-5" />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-sm font-medium sm:text-base">
            {product.name}
          </h2>
          <span
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ${statusTone}`}
          >
            {status}
          </span>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {product.category} <span aria-hidden="true">·</span> {product.slug}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {product.variants.length}{" "}
          {product.variants.length === 1 ? "variant" : "variants"}
        </p>
      </div>
    </div>
  );

  const price = (
    <div className="products-cell-price min-w-0">
      <p className="text-[11px] text-muted-foreground lg:hidden">Price</p>
      <p className="mt-0.5 truncate text-sm font-medium">
        {formatPrice(product.price)}
      </p>
    </div>
  );

  const stock = (
    <div className="products-cell-stock min-w-0">
      <p className="text-[11px] text-muted-foreground lg:hidden">Stock</p>
      <p className={`mt-0.5 truncate text-sm font-medium ${stockTone}`}>
        {product.stock.toLocaleString()}
      </p>
      <p className="text-[11px] text-muted-foreground">{stockLabel}</p>
    </div>
  );

  if (view === "grid") {
    return (
      <article className="overflow-hidden rounded-md border bg-card transition-colors hover:border-foreground/20">
        <div className="relative aspect-[4/3] bg-muted">
          {product.images[0] ? (
            <img
              src={product.images[0].url}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-muted-foreground">
              <Package className="size-8" />
            </span>
          )}
          <span
            className={`absolute top-3 left-3 rounded-md px-2 py-1 text-xs font-medium capitalize ${statusTone}`}
          >
            {status}
          </span>
          <div className="absolute top-2 right-2 rounded-md p-0.5">
            {actions}
          </div>
        </div>
        <div className="space-y-4 p-4">
          <div className="min-w-0">
            <h2 className="truncate font-medium">{product.name}</h2>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {product.category} · {product.variants.length}{" "}
              {product.variants.length === 1 ? "variant" : "variants"}
            </p>
          </div>
          <div className="products-card-metrics grid grid-cols-2 gap-3 border-y py-3">
            {price}
            {stock}
          </div>
          {statistics}
        </div>
      </article>
    );
  }

  return (
    <article className="products-table-row items-center gap-x-3 gap-y-3 p-4 transition-colors hover:bg-muted/25 sm:px-5">
      {identity}
      {price}
      {stock}
      {statistics}
      <div className="products-cell-actions flex items-center justify-end pt-1 lg:pt-0">
        {actions}
      </div>
    </article>
  );
}

function ProductDialog({
  draft,
  categories,
  saving,
  error,
  onChange,
  onClose,
  onSubmit,
}: {
  draft: Draft;
  categories: Category[];
  saving: boolean;
  error: string;
  onChange: (draft: Draft) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const { csrfToken } = useAuth();
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState("");
  const patch = (value: Partial<Draft>, changedPath?: string) => {
    onChange({ ...draft, ...value });
    if (changedPath)
      setValidationErrors((current) =>
        Object.fromEntries(
          Object.entries(current).filter(
            ([path]) =>
              path !== changedPath && !path.startsWith(`${changedPath}.`),
          ),
        ),
      );
  };
  const changeVariant = (index: number, value: Partial<DraftVariant>) =>
    patch({
      variants: draft.variants.map((item, current) =>
        current === index ? { ...item, ...value } : item,
      ),
    }, `variants.${index}`);
  const addImage = (image: Omit<ImageItem, "sortOrder">) => {
    if (!image.url.trim()) return;
    patch({
      images: [...draft.images, { ...image, sortOrder: draft.images.length }],
    }, "images");
    setImageUrl("");
  };
  function submit(event: FormEvent) {
    event.preventDefault();
    const validation = productFormSchema.safeParse(draft);
    if (!validation.success) {
      setValidationErrors(
        validation.error.issues.reduce<Record<string, string>>(
          (errors, issue) => {
            const path = issue.path.join(".");
            if (path && !errors[path]) errors[path] = issue.message;
            return errors;
          },
          {},
        ),
      );
      return;
    }
    setValidationErrors({});
    onSubmit(event);
  }
  async function upload(file: File) {
    if (!csrfToken) return;
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
      setImageError("Choose an image smaller than 10 MB.");
      return;
    }
    setUploading(true);
    setImageError("");
    try {
      const signed = await authenticatedRequest<{
        cloudName: string;
        apiKey: string;
        timestamp: number;
        folder: string;
        signature: string;
      }>("/admin/uploads/signature", csrfToken, { method: "POST" });
      const form = new FormData();
      form.set("file", file);
      form.set("api_key", signed.apiKey);
      form.set("timestamp", String(signed.timestamp));
      form.set("folder", signed.folder);
      form.set("signature", signed.signature);
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`,
        { method: "POST", body: form },
      );
      const result = (await response.json()) as {
        secure_url?: string;
        public_id?: string;
      };
      if (!response.ok || !result.secure_url)
        throw new Error("Cloudinary could not upload this image.");
      addImage({
        url: result.secure_url,
        publicId: result.public_id,
        alt: draft.name,
      });
    } catch (err) {
      setImageError(
        err instanceof Error
          ? err.message
          : "Image upload failed. Check Cloudinary configuration.",
      );
    } finally {
      setUploading(false);
    }
  }
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="!h-[92dvh] !max-h-[92dvh] !max-w-3xl !flex !flex-col !gap-4 !overflow-hidden !rounded-md p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold font-sans">
            {draft.id ? "Edit product" : "Add product"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
          <section className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" error={validationErrors.name}>
              <Input
                value={draft.name}
                aria-invalid={Boolean(validationErrors.name)}
                onChange={(event) =>
                  patch({
                    name: event.target.value,
                    slug: draft.slug || slugify(event.target.value),
                  }, "name")
                }
              />
            </Field>
            <Field label="Slug" error={validationErrors.slug}>
              <Input
                value={draft.slug}
                aria-invalid={Boolean(validationErrors.slug)}
                onChange={(event) =>
                  patch({ slug: slugify(event.target.value) }, "slug")
                }
              />
            </Field>
            <Field label="Category" error={validationErrors.categoryId}>
              <Select
                value={draft.categoryId || "unselected"}
                onValueChange={(value) =>
                  patch(
                    { categoryId: value === "unselected" ? "" : value },
                    "categoryId",
                  )
                }
              >
                <SelectTrigger
                  className="h-9 rounded-md"
                  aria-invalid={Boolean(validationErrors.categoryId)}
                >
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  <SelectItem value="unselected" disabled>
                    Choose a category
                  </SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}{category.isActive ? "" : " (hidden)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Publishing">
              <Select
                value={draft.status}
                onValueChange={(value) =>
                  patch({ status: value as Draft["status"] })
                }
              >
                <SelectTrigger className="h-9 rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  <SelectItem className="rounded-md" value="draft">
                    Draft
                  </SelectItem>
                  <SelectItem className="rounded-md" value="active">
                    Active — visible in shop
                  </SelectItem>
                  <SelectItem className="rounded-md" value="archived">
                    Archived — hidden from shop
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </section>
          <Field label="Description" error={validationErrors.description}>
            <Textarea
              value={draft.description}
              aria-invalid={Boolean(validationErrors.description)}
              onChange={(event) =>
                patch({ description: event.target.value }, "description")
              }
            />
          </Field>
          <section className="grid gap-4 sm:grid-cols-2">
            <Field label="Materials" error={validationErrors.materials}>
              <Input
                value={draft.materials}
                aria-invalid={Boolean(validationErrors.materials)}
                onChange={(event) =>
                  patch({ materials: event.target.value }, "materials")
                }
              />
            </Field>
            <Field label="Dimensions" error={validationErrors.dimensions}>
              <Input
                value={draft.dimensions}
                aria-invalid={Boolean(validationErrors.dimensions)}
                onChange={(event) =>
                  patch({ dimensions: event.target.value }, "dimensions")
                }
              />
            </Field>
          </section>
          <ImageManager
            images={draft.images}
            imageUrl={imageUrl}
            uploading={uploading}
            error={imageError}
            onUrlChange={setImageUrl}
            onAddUrl={() => addImage({ url: imageUrl, alt: draft.name })}
            onUpload={upload}
            onRemove={(index) =>
              patch({
                images: draft.images.filter((_, item) => item !== index),
              }, "images")
            }
            validationError={validationErrors.images}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.cashOnDeliveryAvailable}
              onChange={(event) =>
                patch({ cashOnDeliveryAvailable: event.target.checked })
              }
            />
            Cash on delivery available
          </label>
          <VariantEditor
            variants={draft.variants}
            validationErrors={validationErrors}
            onChange={changeVariant}
            onAdd={() =>
              patch({ variants: [...draft.variants, variant()] }, "variants")
            }
            onRemove={(index) =>
              patch({
                variants: draft.variants.filter((_, item) => item !== index),
              }, "variants")
            }
          />
          {validationErrors.variants && (
            <p role="alert" className="text-sm text-destructive">
              {validationErrors.variants}
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 border-t bg-popover pt-4 pb-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || uploading}>
              {saving ? "Saving…" : "Save product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <div className="mt-1">{children}</div>
      {error && (
        <span role="alert" className="mt-1 block text-xs font-normal text-destructive">
          {error}
        </span>
      )}
    </label>
  );
}
function ImageManager({
  images,
  imageUrl,
  uploading,
  error,
  validationError,
  onUrlChange,
  onAddUrl,
  onUpload,
  onRemove,
}: {
  images: ImageItem[];
  imageUrl: string;
  uploading: boolean;
  error: string;
  validationError?: string;
  onUrlChange: (value: string) => void;
  onAddUrl: () => void;
  onUpload: (file: File) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <section className="space-y-3 rounded-md border p-4">
      <div>
        <p className="font-medium">Product images</p>
        <p className="text-xs text-muted-foreground">
          Upload to Cloudinary or add an existing image URL. The first image is
          the cover.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <Input
          value={imageUrl}
          onChange={(event) => onUrlChange(event.target.value)}
          placeholder="Paste an image URL"
        />
        <Button type="button" variant="outline" onClick={onAddUrl} className="shrink-0">
          <ImagePlus />
          Add URL
        </Button>
        <label className="inline-flex h-8 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 text-sm hover:bg-muted sm:shrink-0">
          <Upload className="size-4" />
          {uploading ? "Uploading…" : "Upload"}
          <input
            className="sr-only"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onUpload(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {validationError && (
        <p role="alert" className="text-xs text-destructive">
          {validationError}
        </p>
      )}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {images.map((image, index) => (
          <div
            key={`${image.url}-${index}`}
            className="group relative aspect-square overflow-hidden rounded-md bg-muted"
          >
            <img
              src={image.url}
              alt={image.alt || "Product"}
              className="size-full object-cover"
            />
            {index === 0 && (
              <span className="absolute bottom-1 left-1 rounded-md bg-background/90 px-1.5 py-0.5 text-[10px]">
                Cover
              </span>
            )}
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="absolute top-1 right-1 rounded-md bg-background p-1 opacity-0 shadow transition-opacity group-hover:opacity-100"
              aria-label="Remove image"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
function VariantEditor({
  variants,
  validationErrors,
  onChange,
  onAdd,
  onRemove,
}: {
  variants: DraftVariant[];
  validationErrors: Record<string, string>;
  onChange: (index: number, value: Partial<DraftVariant>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <section className="space-y-3 rounded-md border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">Variants & inventory</p>
          <p className="text-xs text-muted-foreground">
            Price is shown in EGP; stock is per color and size.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus />
          Add option
        </Button>
      </div>
      {variants.map((item, index) => (
        <div
          key={item.id}
          className="grid grid-cols-1 gap-2 rounded-md bg-muted/50 p-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div className="space-y-1">
            <Input
              placeholder="SKU"
              aria-invalid={Boolean(validationErrors[`variants.${index}.sku`])}
              value={item.sku}
              onChange={(event) =>
                onChange(index, { sku: event.target.value })
              }
            />
            {validationErrors[`variants.${index}.sku`] && (
              <p role="alert" className="text-xs text-destructive">
                {validationErrors[`variants.${index}.sku`]}
              </p>
            )}
          </div>
          <Input
            placeholder="Color"
            value={item.color}
            onChange={(event) => onChange(index, { color: event.target.value })}
          />
          <Input
            placeholder="Size"
            value={item.size}
            onChange={(event) => onChange(index, { size: event.target.value })}
          />
          <div className="space-y-1">
            <Input
              min="0"
              step="any"
              type="number"
              placeholder="Price (EGP)"
              aria-invalid={Boolean(validationErrors[`variants.${index}.price`])}
              value={item.price || ""}
              onChange={(event) =>
                onChange(index, { price: Number(event.target.value) })
              }
            />
            {validationErrors[`variants.${index}.price`] && (
              <p role="alert" className="text-xs text-destructive">
                {validationErrors[`variants.${index}.price`]}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Input
              min="0"
              step="any"
              type="number"
              placeholder="Compare-at price (EGP)"
              aria-invalid={Boolean(
                validationErrors[`variants.${index}.compareAtPrice`],
              )}
              value={item.compareAtPrice}
              onChange={(event) =>
                onChange(index, {
                  compareAtPrice:
                    event.target.value === ""
                      ? ""
                      : Number(event.target.value),
                })
              }
            />
            {validationErrors[`variants.${index}.compareAtPrice`] && (
              <p role="alert" className="text-xs text-destructive">
                {validationErrors[`variants.${index}.compareAtPrice`]}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Input
              min="0"
              step="1"
              type="number"
              placeholder="Stock"
              aria-invalid={Boolean(validationErrors[`variants.${index}.stock`])}
              value={item.stock || ""}
              onChange={(event) =>
                onChange(index, { stock: Number(event.target.value) })
              }
            />
            {validationErrors[`variants.${index}.stock`] && (
              <p role="alert" className="text-xs text-destructive">
                {validationErrors[`variants.${index}.stock`]}
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="col-span-full justify-self-end"
            disabled={variants.length === 1}
            onClick={() => onRemove(index)}
            aria-label="Remove variant"
          >
            <Trash2 className="text-destructive" />
          </Button>
        </div>
      ))}
    </section>
  );
}
