import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  ImagePlus,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogActionButton,
  AlertDialogCancelButton,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { apiRequest, authenticatedRequest } from "@/features/auth/auth-client";
import { useAuth } from "@/features/auth/useAuth";
import { useToast } from "@/features/toast/toast-context";
import type { JournalStory, JournalStoryStatus } from "@/types/journal";

const PAGE_SIZE = 12;

interface JournalAdminResponse {
  stories: JournalStory[];
  counts: {
    total: number;
    publishedCount: number;
    draftCount: number;
  };
  pagination: {
    page: number;
    pageCount: number;
    total: number;
  };
}

interface StoryDraft {
  id?: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  image: string;
  imageAlt: string;
  body: string;
  readMinutes: string;
  relatedProductCategory: string;
  status: JournalStoryStatus;
}

const blankDraft = (): StoryDraft => ({
  title: "",
  slug: "",
  category: "",
  excerpt: "",
  image: "",
  imageAlt: "",
  body: "",
  readMinutes: "1",
  relatedProductCategory: "",
  status: "draft",
});

const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function toDraft(story?: JournalStory): StoryDraft {
  if (!story) return blankDraft();
  return {
    id: story.id,
    title: story.title,
    slug: story.slug,
    category: story.category,
    excerpt: story.excerpt,
    image: story.image,
    imageAlt: story.imageAlt,
    body: story.body.join("\n\n"),
    readMinutes: String(story.readMinutes),
    relatedProductCategory: story.relatedProductCategory,
    status: story.status,
  };
}

function formatDate(value?: string) {
  if (!value) return "Not published";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function JournalAdminSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-11 w-64 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <Skeleton key={item} className="h-24 rounded-md" />
        ))}
      </div>
      <Skeleton className="h-12 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <Skeleton key={item} className="h-80 rounded-md" />
        ))}
      </div>
    </div>
  );
}

export function JournalAdminPage() {
  const { csrfToken } = useAuth();
  const { toast } = useToast();
  const [stories, setStories] = useState<JournalStory[]>([]);
  const [counts, setCounts] = useState({ total: 0, publishedCount: 0, draftCount: 0 });
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [draft, setDraft] = useState<StoryDraft | null>(null);
  const [storyToDelete, setStoryToDelete] = useState<JournalStory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reloadVersion, setReloadVersion] = useState(0);
  const imageInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    async function loadStories() {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (debouncedQuery) params.set("q", debouncedQuery);
      try {
        const result = await apiRequest<JournalAdminResponse>(
          `/admin/journal?${params.toString()}`,
        );
        if (cancelled) return;
        setStories(result.stories);
        setCounts(result.counts);
        const nextPageCount = Math.max(1, result.pagination.pageCount);
        setPageCount(nextPageCount);
        if (page > nextPageCount) setPage(nextPageCount);
      } catch (loadError: unknown) {
        if (!cancelled)
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load journal stories.",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadStories();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, page, reloadVersion]);

  function openEditor(story?: JournalStory) {
    setFormError("");
    setDraft(toDraft(story));
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
        body: JSON.stringify({ type: "journal" }),
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
      const secureUrl = result.secure_url;
      if (!response.ok || !secureUrl)
        throw new Error("Cloudinary could not upload this image.");
      setDraft((current) =>
        current ? { ...current, image: secureUrl } : current,
      );
    } catch (uploadError: unknown) {
      setFormError(
        uploadError instanceof Error
          ? uploadError.message
          : "Image upload failed.",
      );
    } finally {
      setUploading(false);
      if (imageInput.current) imageInput.current.value = "";
    }
  }

  async function saveStory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    if (!csrfToken) {
      setFormError("Your session has expired. Sign in again before saving.");
      return;
    }
    const slug = slugify(draft.slug || draft.title);
    const paragraphs = draft.body
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
    if (!draft.title.trim()) return setFormError("Enter a story title.");
    if (!draft.category.trim()) return setFormError("Enter a story category.");
    if (!slug) return setFormError("Enter a valid URL slug.");
    if (!draft.excerpt.trim()) return setFormError("Add a short introduction.");
    try {
      const imageUrl = new URL(draft.image.trim());
      if (!["http:", "https:"].includes(imageUrl.protocol))
        return setFormError("Use an HTTP or HTTPS hero image URL.");
    } catch {
      return setFormError("Add a valid hero image URL.");
    }
    if (!paragraphs.length) return setFormError("Add at least one story paragraph.");
    if (paragraphs.some((paragraph) => paragraph.length > 5000))
      return setFormError("Each paragraph must be 5,000 characters or fewer.");
    if (paragraphs.join("\n\n").length > 50000)
      return setFormError("The story must be 50,000 characters or fewer.");
    const readMinutes = Number(draft.readMinutes);
    if (!Number.isInteger(readMinutes) || readMinutes < 1 || readMinutes > 120)
      return setFormError("Reading time must be a whole number from 1 to 120 minutes.");

    setSaving(true);
    setFormError("");
    try {
      const payload = {
        ...draft,
        title: draft.title.trim(),
        slug,
        category: draft.category.trim(),
        excerpt: draft.excerpt.trim(),
        image: draft.image.trim(),
        imageAlt: draft.imageAlt.trim(),
        body: paragraphs,
        readMinutes,
        relatedProductCategory: draft.relatedProductCategory.trim(),
      };
      await authenticatedRequest<JournalStory>(
        draft.id ? `/admin/journal/${draft.id}` : "/admin/journal",
        csrfToken,
        {
          method: draft.id ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );
      const label = payload.title;
      setDraft(null);
      setPage(1);
      setReloadVersion((value) => value + 1);
      toast(
        draft.id ? "Journal story updated" : "Journal story created",
        `${label} · ${payload.status}`,
      );
    } catch (saveError: unknown) {
      setFormError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save this journal story.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteStory() {
    if (!storyToDelete) return;
    if (!csrfToken) {
      setError("Your session has expired. Sign in again before deleting.");
      return;
    }
    setDeleting(true);
    setError("");
    try {
      await authenticatedRequest(`/admin/journal/${storyToDelete.id}`, csrfToken, {
        method: "DELETE",
      });
      const deletedTitle = storyToDelete.title;
      setStoryToDelete(null);
      setReloadVersion((value) => value + 1);
      toast("Journal story deleted", deletedTitle);
    } catch (deleteError: unknown) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete this story.",
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading && !stories.length && !error) return <JournalAdminSkeleton />;

  return (
    <div className="space-y-6 sm:space-y-7">
      <PageHeader
        title="Journal"
        description="Write and publish thoughtful stories about rooms, rituals, and the details that make a home your own."
        action={
          <Button className="rounded-md" onClick={() => openEditor()}>
            <Plus />
            New story
          </Button>
        }
      />

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive"
        >
          <span>{error}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setReloadVersion((value) => value + 1)}
          >
            Try again
          </Button>
        </div>
      )}

      <section aria-label="Journal overview" className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "All stories", count: counts.total, icon: BookOpen, tone: "bg-clay/10 text-clay" },
          { label: "Published", count: counts.publishedCount, icon: Check, tone: "bg-emerald-500/10 text-emerald-700" },
          { label: "Drafts", count: counts.draftCount, icon: FileText, tone: "bg-amber-500/10 text-amber-700" },
        ].map(({ label, count, icon: Icon, tone }) => (
          <Card key={label} className="gap-4 rounded-md border-0 py-4 shadow-none ring-1 ring-foreground/8 sm:py-5">
            <CardContent className="flex items-center gap-4 px-4 sm:px-5">
              <span className={`grid size-10 shrink-0 place-items-center rounded-full ${tone}`}>
                <Icon className="size-4" strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">{count.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="gap-0 rounded-md border-0 py-0 shadow-none ring-1 ring-foreground/8">
        <CardContent className="space-y-5 p-4 sm:p-5">
          <div>
            <h2 className="font-sans text-base font-medium sm:text-lg">Your stories</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Published stories appear on the Journal page. Drafts remain private.
            </p>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => {
                setPage(1);
                setQuery(event.target.value);
              }}
              placeholder="Search title, category, or URL"
              aria-label="Search journal stories"
              className="h-10 bg-background pl-9"
            />
          </div>

          {loading && stories.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((item) => <Skeleton key={item} className="h-72 rounded-md" />)}
            </div>
          ) : stories.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {stories.map((story) => (
                <article key={story.id} className="group min-w-0 overflow-hidden rounded-md border border-border bg-background">
                  <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                    <img
                      src={story.image}
                      alt={story.imageAlt || story.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                    <Badge
                      variant="outline"
                      className={`absolute top-3 right-3 rounded-md border-0 bg-background/90 ${
                        story.status === "published" ? "text-emerald-800" : "text-amber-800"
                      }`}
                    >
                      {story.status === "published" ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <div className="space-y-3 p-4">
                    <p className="eyebrow text-clay">
                      {story.category} · {story.readMinutes} min read
                    </p>
                    <h3 className="line-clamp-2 font-serif text-2xl tracking-tight">{story.title}</h3>
                    <p className="line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
                      {story.excerpt}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {story.status === "published"
                        ? `Published ${formatDate(story.publishedAt)}`
                        : `Updated ${formatDate(story.updatedAt)}`}
                    </p>
                    <div className="flex gap-2 border-t border-border/70 pt-3">
                      {story.status === "published" && (
                        <Button variant="outline" size="sm" className="flex-1 mt-1" asChild>
                          <a href={`/journal/${story.slug}`} target="_blank" rel="noreferrer">
                            <Eye className="size-4 ml-1 mb-0.5" />
                            Preview
                          </a>
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="flex-1 mt-1" onClick={() => openEditor(story)}>
                        <Pencil />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={`Delete ${story.title}`}
                        className="text-destructive hover:text-destructive mt-0.5"
                        onClick={() => setStoryToDelete(story)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
              <BookOpen className="size-8 text-clay" strokeWidth={1.25} />
              <p className="mt-4 font-serif text-2xl">
                {debouncedQuery ? "No matching stories" : "Begin your journal"}
              </p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                {debouncedQuery
                  ? "Try searching with a different title, URL, or category."
                  : "Add a title, a beautiful cover image, and your first story."}
              </p>
              {!debouncedQuery && (
                <Button className="mt-4" onClick={() => openEditor()}>
                  <Plus />
                  Create a story
                </Button>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
            <p className="text-xs text-muted-foreground">
              {pageCount > 1
                ? `Page ${page} of ${pageCount}`
                : `${stories.length} ${stories.length === 1 ? "story" : "stories"}`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                <ChevronLeft /> Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= pageCount || loading}
                onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
              >
                Next <ChevronRight />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {draft && (
        <Dialog open onOpenChange={(open) => !open && !saving && setDraft(null)}>
          <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-md sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{draft.id ? "Edit journal story" : "Write a journal story"}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Shape the introduction, cover image, and story paragraphs shown on the Journal page.
              </p>
            </DialogHeader>
            <form className="space-y-4" onSubmit={saveStory}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm sm:col-span-2">
                  <span>Story title</span>
                  <Input
                    required
                    className="h-10 !rounded-md"
                    maxLength={160}
                    value={draft.title}
                    onChange={(event) => {
                      const title = event.target.value;
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              title,
                              slug:
                                !current.id || current.slug === slugify(current.title)
                                  ? slugify(title)
                                  : current.slug,
                            }
                          : current,
                      );
                    }}
                    placeholder="A room that unfolds slowly"
                  />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span>Category label</span>
                  <Input
                    className="h-10 !rounded-md"
                    required
                    maxLength={60}
                    value={draft.category}
                    onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                    placeholder="Living well"
                  />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span>URL slug</span>
                  <Input
                    required
                    className="h-10 !rounded-md"
                    maxLength={120}
                    value={draft.slug}
                    onChange={(event) => setDraft({ ...draft, slug: slugify(event.target.value) })}
                    placeholder="a-room-that-unfolds-slowly"
                  />
                </label>
              </div>

              <label className="block space-y-1.5 text-sm">
                <span>Introduction</span>
                <Textarea
                  required
                  maxLength={500}
                  rows={3}
                  value={draft.excerpt}
                  onChange={(event) => setDraft({ ...draft, excerpt: event.target.value })}
                  placeholder="A short introduction shown below the headline."
                />
                <span className="block text-right text-xs text-muted-foreground">
                  {draft.excerpt.length}/500
                </span>
              </label>

              <div className="space-y-2">
                <label className="block space-y-1.5 text-sm">
                  <span>Cover image URL</span>
                  <Input
                    required
                    className="h-10 !rounded-md"
                    type="url"
                    value={draft.image}
                    onChange={(event) => setDraft({ ...draft, image: event.target.value })}
                    placeholder="Paste an image URL or upload a file"
                  />
                </label>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Use a landscape image for the story cover.
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
                    {uploading ? "Uploading…" : "Upload image"}
                  </Button>
                </div>
                {draft.image ? (
                  <div className="aspect-[16/8] overflow-hidden rounded-md border border-border bg-muted">
                    <img
                      src={draft.image}
                      alt={draft.imageAlt || "Journal cover preview"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[16/8] items-center justify-center rounded-md border border-dashed border-border bg-muted/30 text-muted-foreground">
                    <ImagePlus className="size-7" />
                  </div>
                )}
              </div>

              <label className="block space-y-1.5 text-sm">
                <span>Image description <span className="text-muted-foreground">(optional)</span></span>
                <Input
                className="h-10 !rounded-md"
                  maxLength={240}
                  value={draft.imageAlt}
                  onChange={(event) => setDraft({ ...draft, imageAlt: event.target.value })}
                  placeholder="Describe the cover image for screen readers"
                />
              </label>

              <label className="block space-y-1.5 text-sm">
                <span>Story body</span>
                <Textarea
                  required
                  rows={10}
                  value={draft.body}
                  onChange={(event) => setDraft({ ...draft, body: event.target.value })}
                  placeholder={"Write your story here.\n\nLeave a blank line between paragraphs."}
                  className="min-h-60 leading-7"
                />
                <p className="text-xs text-muted-foreground">
                  Separate paragraphs with a blank line.
                </p>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm">
                  <span>Reading time (minutes)</span>
                  <Input
                    required
                    type="number"
                    min="1"
                    max="120"
                    step="1"
                    className="h-10 !rounded-md"
                    value={draft.readMinutes}
                    onChange={(event) =>
                      setDraft({ ...draft, readMinutes: event.target.value })
                    }
                  />
                  <span className="block text-xs text-muted-foreground">
                    Set the reading time shown on the Journal page.
                  </span>
                </label>
                <label className="space-y-1.5 text-sm">
                  <span>Related product category <span className="text-muted-foreground">(optional)</span></span>
                  <Input
                    maxLength={100}
                    className="h-10 !rounded-md"
                    value={draft.relatedProductCategory}
                    onChange={(event) =>
                      setDraft({ ...draft, relatedProductCategory: event.target.value })
                    }
                    placeholder="e.g. Living"
                  />
                </label>
                <label className="space-y-1.5 text-sm sm:col-span-2">
                  <span>Visibility</span>
                  <Select
                    value={draft.status}
                    onValueChange={(value) => {
                      if (value === "draft" || value === "published")
                        setDraft({ ...draft, status: value });
                    }}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Save as draft</SelectItem>
                      <SelectItem value="published">Publish story</SelectItem>
                    </SelectContent>
                  </Select>
                </label>
              </div>

              {formError && (
                <p role="alert" className="rounded-md bg-destructive/5 p-3 text-sm text-destructive">
                  {formError}
                </p>
              )}
              <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDraft(null)}
                  disabled={saving || uploading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || uploading}>
                  {saving
                    ? "Saving…"
                    : draft.status === "published"
                      ? "Publish story"
                      : "Save draft"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
      <AlertDialog
        open={Boolean(storyToDelete)}
        onOpenChange={(open) => !open && !deleting && setStoryToDelete(null)}
      >
        <AlertDialogContent className="rounded-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-sans">
              Delete journal story?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {storyToDelete
                ? `“${storyToDelete.title}” will be permanently deleted and removed from the Journal. This cannot be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancelButton disabled={deleting}>
              Cancel
            </AlertDialogCancelButton>
            <AlertDialogActionButton
              disabled={!storyToDelete || deleting}
              onClick={(event) => {
                event.preventDefault();
                void deleteStory();
              }}
            >
              {deleting ? "Deleting…" : "Delete story"}
            </AlertDialogActionButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
