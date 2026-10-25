import { useEffect, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Search,
  Star,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { apiRequest, authenticatedRequest } from "@/features/auth/auth-client";
import { useAuth } from "@/features/auth/useAuth";
import { useToast } from "@/features/toast/ToastProvider";

const PAGE_SIZE = 10;
type ReviewStatus = "pending" | "published" | "rejected" | "all";

interface AdminReview {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  customerName: string;
  customerEmail: string;
  avatarUrl: string;
  rating: number;
  comment: string;
  status: Exclude<ReviewStatus, "all">;
  createdAt: string;
}

interface ReviewsResponse {
  reviews: AdminReview[];
  pagination: { page: number; pageCount: number; total: number };
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function ReviewsPageSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-28 rounded-md" />
      <Skeleton className="h-12 rounded-md" />
      {[0, 1, 2].map((item) => (
        <Skeleton key={item} className="h-52 rounded-md" />
      ))}
    </div>
  );
}

export function ReviewsAdminPage() {
  const { csrfToken } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [status, setStatus] = useState<ReviewStatus>("pending");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => {
        setDebouncedQuery(query.trim());
        setPage(1);
        setLoading(true);
      },
      250,
    );
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    async function loadReviews() {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        status,
      });
      if (debouncedQuery) params.set("search", debouncedQuery);
      try {
        const result = await apiRequest<ReviewsResponse>(
          `/admin/reviews?${params.toString()}`,
        );
        if (cancelled) return;
        setReviews(result.reviews);
        setTotal(result.pagination.total);
        const nextPageCount = Math.max(1, result.pagination.pageCount);
        setPageCount(nextPageCount);
        if (page > nextPageCount) setPage(nextPageCount);
      } catch (loadError: unknown) {
        if (!cancelled)
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load reviews.",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadReviews();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, page, reloadVersion, status]);

  async function updateStatus(review: AdminReview, nextStatus: "published" | "rejected") {
    if (!csrfToken) {
      toast("Action unavailable", "Refresh the page and try again.");
      return;
    }
    setActionId(review.id);
    try {
      await authenticatedRequest(
        `/admin/reviews/${encodeURIComponent(review.id)}/status`,
        csrfToken,
        {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus }),
        },
      );
      toast(
        nextStatus === "published" ? "Review approved" : "Review rejected",
        `${review.customerName}'s review has been ${nextStatus === "published" ? "published" : "rejected"}.`,
      );
      setLoading(true);
      setReloadVersion((version) => version + 1);
    } catch (actionError: unknown) {
      toast(
        "Could not update review",
        actionError instanceof Error ? actionError.message : "Please try again.",
      );
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title="Customer reviews"
        description="Review customer feedback before it appears on product pages."
        action={
          <Badge variant="outline" className="h-7 px-3">
            {total} {total === 1 ? "review" : "reviews"}
          </Badge>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search reviews, customers, or products..."
              className="h-11 pl-9"
              aria-label="Search reviews"
            />
          </label>
          <div className="flex flex-wrap gap-2" aria-label="Review status filters">
            {(["pending", "published", "rejected", "all"] as const).map(
              (filter) => (
                <Button
                  key={filter}
                  type="button"
                  size="sm"
                  variant={status === filter ? "default" : "outline"}
                  className="capitalize"
                  onClick={() => {
                    setStatus(filter);
                    setPage(1);
                    setLoading(true);
                    setError("");
                  }}
                >
                  {filter === "published" ? "Approved" : filter}
                </Button>
              ),
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <ReviewsPageSkeleton />
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-4 p-7">
            <p role="alert" className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              onClick={() => {
                setLoading(true);
                setReloadVersion((version) => version + 1);
              }}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : reviews.length ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="space-y-5 p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar size="lg">
                      <AvatarImage src={review.avatarUrl} alt="" />
                      <AvatarFallback>
                        {review.customerName.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {review.customerName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {review.customerEmail}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge
                      variant={
                        review.status === "published"
                          ? "secondary"
                          : review.status === "rejected"
                            ? "destructive"
                            : "outline"
                      }
                      className="capitalize"
                    >
                      {review.status === "published" ? "Approved" : review.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 text-clay" aria-label={`${review.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={`size-4 ${index < review.rating ? "fill-current" : "text-muted-foreground/30"}`}
                    />
                  ))}
                </div>

                <p className="text-sm leading-6 text-muted-foreground">
                  {review.comment}
                </p>

                <div className="flex flex-col justify-between gap-4 border-t border-border/70 pt-4 sm:flex-row sm:items-center">
                  <a
                    href={`/products/${encodeURIComponent(review.productSlug)}`}
                    className="flex min-w-0 items-center gap-3 text-sm hover:text-clay"
                  >
                    {review.productImage ? (
                      <img
                        src={review.productImage}
                        alt=""
                        className="size-10 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <span className="size-10 shrink-0 rounded-md bg-muted" />
                    )}
                    <span className="truncate">{review.productName}</span>
                  </a>
                  {review.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-full"
                        disabled={actionId === review.id}
                        onClick={() => void updateStatus(review, "published")}
                      >
                        <Check />
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        disabled={actionId === review.id}
                        onClick={() => void updateStatus(review, "rejected")}
                      >
                        <X />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          <div className="flex items-center justify-between gap-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Page {page} of {pageCount}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Previous page"
                disabled={page <= 1}
                onClick={() => {
                  setLoading(true);
                  setPage((current) => Math.max(1, current - 1));
                }}
              >
                <ChevronLeft />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Next page"
                disabled={page >= pageCount}
                onClick={() => {
                  setLoading(true);
                  setPage((current) => Math.min(pageCount, current + 1))
                }}
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Star className="size-5" />
            </span>
            <h2 className="mt-4 font-serif text-2xl">No reviews found</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {debouncedQuery
                ? "Try a different search term."
                : "Customer reviews will appear here when they are submitted."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
