import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ImagePlus,
  Pencil,
  Plus,
  Search,
  Tags,
  Trash2,
  Upload,
} from "lucide-react";
import type { Category } from "@/types/product";
import { apiRequest, authenticatedRequest } from "@/features/auth/auth-client";
import { useAuth } from "@/features/auth/useAuth";
import { useToast } from "@/features/toast/ToastProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";

type CategoryDraft = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  sortOrder: string;
  isActive: boolean;
};

const emptyDraft = (): CategoryDraft => ({
  name: "",
  slug: "",
  description: "",
  image: "",
  sortOrder: "0",
  isActive: true,
});

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function categoryDraft(category?: Category): CategoryDraft {
  return category
    ? {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description ?? "",
        image: category.image ?? "",
        sortOrder: String(category.sortOrder),
        isActive: category.isActive,
      }
    : emptyDraft();
}

export function CategoriesPage() {
  const { csrfToken } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<CategoryDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const imageInput = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setCategories(await apiRequest<Category[]>("/admin/categories"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    apiRequest<Category[]>("/admin/categories")
      .then((items) => {
        if (!cancelled) setCategories(items);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Unable to load categories.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleCategories = useMemo(() => {
    const term = query.trim().toLowerCase();
    return [...categories]
      .filter((category) =>
        `${category.name} ${category.slug} ${category.description ?? ""}`
          .toLowerCase()
          .includes(term),
      )
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
      );
  }, [categories, query]);

  function openEditor(category?: Category) {
    setFormError("");
    setPreviewFailed(false);
    setDraft(categoryDraft(category));
  }

  async function uploadImage(file?: File) {
    if (!file || !draft) return;
    if (!csrfToken) {
      setFormError("Your session has expired. Sign in again before uploading.");
      return;
    }
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
      setFormError("Choose an image smaller than 10 MB.");
      return;
    }
    setUploading(true);
    setFormError("");
    try {
      const signed = await authenticatedRequest<{
        cloudName: string;
        apiKey: string;
        timestamp: number;
        folder: string;
        signature: string;
      }>("/admin/uploads/signature", csrfToken, {
        method: "POST",
        body: JSON.stringify({ type: "category" }),
      });
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
      const result = (await response.json()) as { secure_url?: string };
      if (!response.ok || !result.secure_url)
        throw new Error("Cloudinary could not upload this image.");
      const secureUrl = result.secure_url;
      setDraft((current) =>
        current ? { ...current, image: secureUrl } : current,
      );
      setPreviewFailed(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Image upload failed.",
      );
    } finally {
      setUploading(false);
      if (imageInput.current) imageInput.current.value = "";
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    if (!csrfToken) {
      setFormError("Your session has expired. Sign in again before saving.");
      return;
    }
    const slug = slugify(draft.slug || draft.name);
    const sortOrder = Number(draft.sortOrder);
    if (!draft.name.trim()) {
      setFormError("Enter a category name.");
      return;
    }
    if (!slug) {
      setFormError("Enter a valid category slug.");
      return;
    }
    if (!draft.image.trim()) {
      setFormError("Add an image URL for this category.");
      return;
    }
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      setFormError("Sort order must be a whole number of 0 or greater.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const body = {
        name: draft.name.trim(),
        slug,
        description: draft.description.trim(),
        image: draft.image.trim(),
        sortOrder,
        isActive: draft.isActive,
      };
      await authenticatedRequest<Category>(
        draft.id ? `/admin/categories/${draft.id}` : "/admin/categories",
        csrfToken,
        {
          method: draft.id ? "PATCH" : "POST",
          body: JSON.stringify(body),
        },
      );
      setDraft(null);
      await load();
      toast(draft.id ? "Category updated" : "Category created", body.name);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not save this category.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(category: Category) {
    if (!csrfToken) {
      setError("Your session has expired. Sign in again before deleting.");
      return;
    }
    if (
      !window.confirm(
        `Delete “${category.name}”? This action cannot be undone.`,
      )
    )
      return;
    setError("");
    try {
      await authenticatedRequest(`/admin/categories/${category.id}`, csrfToken, {
        method: "DELETE",
      });
      await load();
      toast("Category deleted", category.name);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete this category.",
      );
    }
  }

  if (loading) return <CategoriesPageSkeleton />;

  return (
    <div className="space-y-7">
      <PageHeader
        title="Categories"
        description="Create image-led collections that organize your products and shape the storefront."
        action={
          <Button className="rounded-xl" onClick={() => openEditor()}>
            <Plus />
            Add category
          </Button>
        }
      />

      <Card className="rounded-md border-0 shadow-none ring-1 ring-foreground/8">
        <CardContent className="space-y-5 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{categories.length} categories</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Active categories appear on the storefront.
              </p>
            </div>
            <label className="relative block w-full sm:max-w-xs">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search categories"
                className="pl-9"
                placeholder="Search categories"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </div>

          {error && (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-md border border-destructive/25 bg-destructive/5 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <p>{error}</p>
              <Button variant="outline" size="sm" onClick={() => void load()}>
                Try again
              </Button>
            </div>
          )}

          {visibleCategories.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleCategories.map((category) => (
                <article
                  key={category.id}
                  className="group min-w-0 overflow-hidden rounded-md border border-border bg-background"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <ImagePlus className="size-8" strokeWidth={1.25} />
                      </div>
                    )}
                    <span
                      className={`absolute top-3 right-3 rounded-full px-3 py-1 text-[10px] font-medium ${
                        category.isActive
                          ? "bg-background/90 text-foreground"
                          : "bg-foreground/80 text-background"
                      }`}
                    >
                      {category.isActive ? "Active" : "Hidden"}
                    </span>
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate font-serif text-xl">
                          {category.name}
                        </h2>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          /{category.slug} · Order {category.sortOrder}
                        </p>
                      </div>
                      <Tags className="mt-1 size-4 shrink-0 text-clay" />
                    </div>
                    <p className="line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
                      {category.description || "No description added yet."}
                    </p>
                    <div className="flex flex-wrap gap-2 border-t border-border/70 pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditor(category)}
                      >
                        <Pencil />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        aria-label={`Delete ${category.name}`}
                        onClick={() => void remove(category)}
                      >
                        <Trash2 />
                        Delete
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
              <Tags className="size-8 text-clay" strokeWidth={1.25} />
              <p className="mt-4 font-serif text-2xl">
                {query ? "No matching categories" : "Start with a category"}
              </p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                {query
                  ? "Try a different name or description."
                  : "Add an image, a short description, and a title to introduce a collection."}
              </p>
              {!query && (
                <Button className="mt-4" onClick={() => openEditor()}>
                  <Plus />
                  Add category
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {draft && (
        <Dialog open onOpenChange={(open) => !open && setDraft(null)}>
          <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-md sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {draft.id ? "Edit category" : "Add category"}
              </DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={save}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm">
                  <span>Category name</span>
                  <Input
                    required
                    maxLength={100}
                    value={draft.name}
                    onChange={(event) => {
                      const name = event.target.value;
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              name,
                              slug:
                                !current.id ||
                                current.slug === slugify(current.name)
                                  ? slugify(name)
                                  : current.slug,
                            }
                          : current,
                      );
                    }}
                  />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span>URL slug</span>
                  <Input
                    required
                    maxLength={100}
                    value={draft.slug}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? { ...current, slug: slugify(event.target.value) }
                          : current,
                      )
                    }
                  />
                </label>
              </div>
              <label className="block space-y-1.5 text-sm">
                <span>Description</span>
                <Textarea
                  maxLength={500}
                  value={draft.description}
                  onChange={(event) =>
                    setDraft({ ...draft, description: event.target.value })
                  }
                  placeholder="A short line to introduce this collection"
                />
              </label>
              <div className="space-y-1.5">
                <label className="block space-y-1.5 text-sm">
                  <span>Category image</span>
                  <Input
                    required
                    type="url"
                    value={draft.image}
                    onChange={(event) => {
                      setDraft({ ...draft, image: event.target.value });
                      setPreviewFailed(false);
                    }}
                    placeholder="Paste an image URL or upload a file"
                  />
                </label>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Use a wide, landscape image for the storefront card.
                  </p>
                  <input
                    ref={imageInput}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => void uploadImage(event.target.files?.[0])}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => imageInput.current?.click()}
                  >
                    <Upload />
                    {uploading ? "Uploading…" : "Upload"}
                  </Button>
                </div>
              </div>
              {draft.image && !previewFailed && (
                <div className="overflow-hidden rounded-md border border-border bg-muted">
                  <img
                    src={draft.image}
                    alt={`${draft.name || "Category"} preview`}
                    className="max-h-56 w-full object-cover"
                    onError={() => setPreviewFailed(true)}
                  />
                </div>
              )}
              {draft.image && previewFailed && (
                <p role="status" className="text-xs text-destructive">
                  This image could not be previewed. Check the URL or upload another image.
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm">
                  <span>Sort order</span>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={draft.sortOrder}
                    onChange={(event) =>
                      setDraft({ ...draft, sortOrder: event.target.value })
                    }
                  />
                </label>
                <label className="flex items-center gap-3 self-end rounded-md border border-border px-3 py-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.isActive}
                    onChange={(event) =>
                      setDraft({ ...draft, isActive: event.target.checked })
                    }
                    className="size-4 accent-clay"
                  />
                  Show on storefront
                </label>
              </div>
              {formError && (
                <p role="alert" className="text-sm text-destructive">
                  {formError}
                </p>
              )}
              <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDraft(null)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || uploading}>
                  {saving ? "Saving…" : draft.id ? "Save changes" : "Create category"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function CategoriesPageSkeleton() {
  return (
    <div
      className="space-y-6 sm:space-y-7"
      aria-busy="true"
      aria-label="Loading categories"
    >
      <div
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        aria-hidden="true"
      >
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

      <Card className="rounded-md border-0 py-0 shadow-none ring-1 ring-foreground/8">
        <CardContent className="space-y-5 p-4 sm:p-6" aria-hidden="true">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-10 w-full sm:max-w-xs" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-md border border-border"
              >
                <Skeleton className="aspect-[16/9] rounded-none" />
                <div className="space-y-3 p-4">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                  <div className="flex gap-2 border-t border-border/70 pt-3">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
