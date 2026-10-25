import { useEffect, useState } from "react";
import {
  AtSign,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Mail,
  Search,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { apiRequest } from "@/features/auth/auth-client";
import { useToast } from "@/features/toast/ToastProvider";

const PAGE_SIZE = 20;

interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribedAt: string;
}

interface SubscribersResponse {
  subscribers: NewsletterSubscriber[];
  subscriberCount: number;
  pagination: {
    page: number;
    pageCount: number;
    total: number;
  };
}

function NewsletterPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-11 w-64 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1].map((item) => (
          <Card key={item} className="rounded-md">
            <CardContent className="flex items-center gap-4 p-5">
              <Skeleton className="size-11 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="rounded-md">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <Skeleton className="h-10 w-full" />
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function subscriptionDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
      }).format(date);
}

export function NewsletterPage() {
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedQuery(query.trim()),
      250,
    );
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    async function loadSubscribers() {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (debouncedQuery) params.set("search", debouncedQuery);

      try {
        const result = await apiRequest<SubscribersResponse>(
          `/newsletter/subscribers?${params.toString()}`,
        );
        if (cancelled) return;
        setSubscribers(result.subscribers);
        setSubscriberCount(result.subscriberCount);
        setTotal(result.pagination.total);
        const nextPageCount = Math.max(1, result.pagination.pageCount);
        setPageCount(nextPageCount);
        if (page > nextPageCount) setPage(nextPageCount);
      } catch (loadError: unknown) {
        if (!cancelled)
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load newsletter subscribers.",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadSubscribers();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, page, reloadVersion]);

  async function copyEmail(subscriber: NewsletterSubscriber) {
    setActionError(null);
    try {
      await navigator.clipboard.writeText(subscriber.email);
      setCopiedId(subscriber.id);
      toast("Email copied", subscriber.email);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setActionError("Unable to copy this email. Check your browser permissions.");
    }
  }

  if (loading && !subscribers.length && !error) return <NewsletterPageSkeleton />;

  return (
    <TooltipProvider delay={400}>
    <div className="space-y-6">
      <PageHeader
        title="Newsletter"
        description="A thoughtful note, once a month. View and search the people who have asked to hear from your journal."
      />

      <section
        aria-label="Newsletter subscriber overview"
        className="grid gap-3 sm:grid-cols-2"
      >
        <Card className="gap-4 rounded-md border-0 py-4 shadow-none ring-1 ring-foreground/8 sm:py-5">
          <CardContent className="flex items-center gap-4 px-4 sm:px-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-clay/10 text-clay">
              <Users className="size-5" strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total subscribers
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">
                {subscriberCount.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="gap-4 rounded-md border-0 py-4 shadow-none ring-1 ring-foreground/8 sm:py-5">
          <CardContent className="flex items-center gap-4 px-4 sm:px-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-700">
              <Mail className="size-5" strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {query.trim() ? "Search results" : "Showing subscribers"}
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">
                {total.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="gap-0 rounded-md border-0 py-0 shadow-none ring-1 ring-foreground/8">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div>
            <div className="mb-4">
              <h2 className="text-base sm:text-lg font-medium font-sans">Subscriber list</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Search for an email or select a subscriber to write to them.
              </p>
            </div>
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => {
                  setPage(1);
                  setQuery(event.target.value);
                }}
                placeholder="Search subscriber email"
                aria-label="Search subscriber email"
                className="h-10 rounded-md bg-background pl-9 pr-9"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setPage(1);
                    setQuery("");
                  }}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              <span>{error}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-md"
                onClick={() => setReloadVersion((value) => value + 1)}
              >
                Try again
              </Button>
            </div>
          )}
          {actionError && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              <span>{actionError}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-md"
                onClick={() => setActionError(null)}
              >
                Dismiss
              </Button>
            </div>
          )}

          <div className="overflow-hidden rounded-md border border-border">
            <div className="hidden grid-cols-[minmax(0,1fr)_minmax(160px,0.4fr)_56px] items-center gap-4 bg-muted/50 px-5 py-3 text-xs font-semibold text-muted-foreground sm:grid">
              <span>Email address</span>
              <span className="text-center">Subscribed</span>
              <span className="sr-only">Copy email</span>
            </div>
            {loading && subscribers.length > 0 ? (
              <div className="space-y-3 p-4" aria-label="Updating subscribers">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : subscribers.length ? (
              <div className="divide-y divide-border">
                {subscribers.map((subscriber) => (
                  <div
                    key={subscriber.id}
                    className="grid grid-cols-[minmax(0,1fr)_48px] items-center gap-x-3 gap-y-2 px-4 py-4 transition-colors hover:bg-muted/30 sm:grid-cols-[minmax(0,1fr)_minmax(160px,0.4fr)_56px] sm:gap-4 sm:px-5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-clay/10 text-clay">
                        <AtSign className="size-4" strokeWidth={1.8} />
                      </span>
                      <a
                        href={`mailto:${subscriber.email}`}
                        className="truncate text-sm font-medium text-foreground underline-offset-4 hover:text-clay hover:underline"
                      >
                        {subscriber.email}
                      </a>
                    </div>
                    <span className="col-start-1 pl-12 text-xs text-muted-foreground sm:col-start-2 sm:row-start-1 sm:pl-0 sm:text-center sm:text-sm">
                      {subscriptionDate(subscriber.subscribedAt)}
                    </span>
                    <div className="col-start-2 row-start-1 row-span-2 flex items-center justify-center sm:col-start-3 sm:row-span-1">
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-9 w-9"
                              aria-label={`Copy ${subscriber.email}`}
                              onClick={() => void copyEmail(subscriber)}
                            >
                              {copiedId === subscriber.id ? (
                                <Check className="size-4 text-emerald-700" />
                              ) : (
                                <Copy className="size-4" />
                              )}
                            </Button>
                          }
                        />
                        <TooltipContent>
                          {copiedId === subscriber.id ? "Copied" : "Copy email"}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-56 flex-col items-center justify-center px-5 text-center">
                <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
                  <Mail className="size-5" />
                </span>
                <p className="mt-4 font-serif text-xl">
                  {query.trim() ? "No matching subscribers" : "Your list is just beginning"}
                </p>
                <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                  {query.trim()
                    ? "Try another email address or clear your search."
                    : "New subscribers will appear here when they join from the storefront."}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {total > 0
                ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(
                    page * PAGE_SIZE,
                    total,
                  )} of ${total.toLocaleString()}`
                : "No subscribers to show"}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-md"
                disabled={page <= 1 || loading}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                <ChevronLeft />
                Previous
              </Button>
              <span className="px-1 text-xs text-muted-foreground">
                {page} / {pageCount}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-md"
                disabled={page >= pageCount || loading}
                onClick={() =>
                  setPage((value) => Math.min(pageCount, value + 1))
                }
              >
                Next
                <ChevronRight />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </TooltipProvider>
  );
}
