import { useEffect, useState, type MouseEvent } from "react";
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  ShoppingBag,
  UserRoundPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/features/admin/components/PageHeader";
import {
  useAdminNotifications,
  type AdminNotification,
} from "@/features/admin/notifications/admin-notifications-context";
import {
  type AdminNotificationType,
  isAdminNotificationType,
  notificationTimeLabel,
} from "@/features/admin/notifications/notification-utils";
import { apiRequest } from "@/features/auth/auth-client";

const PAGE_SIZE = 15;

const notificationPresentation: Record<
  AdminNotificationType,
  {
    label: string;
    icon: typeof Bell;
    tone: string;
  }
> = {
  new_order: {
    label: "New order",
    icon: ShoppingBag,
    tone: "bg-blue-100 text-blue-700",
  },
  order_status: {
    label: "Order update",
    icon: PackageCheck,
    tone: "bg-emerald-100 text-emerald-700",
  },
  low_stock: {
    label: "Low stock",
    icon: AlertTriangle,
    tone: "bg-rose-100 text-rose-700",
  },
  new_customer: {
    label: "New customer",
    icon: UserRoundPlus,
    tone: "bg-violet-100 text-violet-700",
  },
};

interface NotificationsResponse {
  notifications: AdminNotification[];
  unreadCount: number;
  pagination: {
    page: number;
    pageCount: number;
    total: number;
  };
}

function NotificationsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-11 w-64 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-12 w-full" />
      <Card className="rounded-md">
        <CardContent className="space-y-4 p-4 sm:p-5">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="flex items-start gap-3 border-b border-border pb-4 last:border-0 last:pb-0"
            >
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-52 max-w-full" />
                <Skeleton className="h-3 w-72 max-w-full" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function NotificationsPage() {
  const {
    unreadCount,
    version,
    markRead,
    markAllRead,
  } = useAdminNotifications();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | AdminNotificationType>(
    "all",
  );
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (unreadOnly) params.set("unread", "true");
      setLoading(true);
      setError(null);
      try {
        const response = await apiRequest<NotificationsResponse>(
          `/admin/notifications?${params.toString()}`,
        );
        if (cancelled) return;
        setNotifications(response.notifications);
        const nextPageCount = Math.max(1, response.pagination.pageCount);
        setPageCount(nextPageCount);
        setTotal(response.pagination.total);
        if (page > nextPageCount) setPage(nextPageCount);
      } catch (loadError: unknown) {
        if (!cancelled)
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load notifications.",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [page, reloadVersion, typeFilter, unreadOnly, version]);

  async function changeReadState(notification: AdminNotification) {
    setActionError(null);
    try {
      await markRead(notification.id, !notification.isRead);
    } catch (requestError) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update this notification.",
      );
    }
  }

  async function markEverythingRead() {
    setActionError(null);
    try {
      await markAllRead();
      setPage(1);
    } catch (requestError) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to mark notifications as read.",
      );
    }
  }

  async function openNotification(
    event: MouseEvent<HTMLAnchorElement>,
    notification: AdminNotification,
  ) {
    event.preventDefault();
    try {
      if (!notification.isRead)
        await markRead(notification.id, true);
      window.location.assign(notification.href);
    } catch (requestError) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to open this notification.",
      );
    }
  }

  if (loading && !notifications.length && !error)
    return <NotificationsPageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Stay up to date with orders, inventory, and customer activity."
        action={
          <Button
            type="button"
            variant="outline"
            className="rounded-md"
            onClick={() => void markEverythingRead()}
            disabled={unreadCount === 0}
          >
            <CheckCheck />
            Mark all as read
          </Button>
        }
      />

      <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={unreadOnly ? "outline" : "secondary"}
            className="rounded-md"
            onClick={() => {
              setUnreadOnly(false);
              setPage(1);
            }}
          >
            All activity
          </Button>
          <Button
            type="button"
            size="sm"
            variant={unreadOnly ? "secondary" : "outline"}
            className="rounded-md"
            onClick={() => {
              setUnreadOnly(true);
              setPage(1);
            }}
          >
            Unread
            {unreadCount > 0 && (
              <span className="ml-1 rounded-full bg-clay px-1.5 py-0.5 text-[10px] text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
        </div>
        <Select
          value={typeFilter}
          onValueChange={(value) => {
            if (value === "all" || isAdminNotificationType(value)) {
              setTypeFilter(value);
              setPage(1);
            }
          }}
        >
          <SelectTrigger className="h-9 w-full rounded-md sm:w-48">
            <SelectValue placeholder="All notification types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {Object.entries(notificationPresentation).map(([type, detail]) => (
              <SelectItem key={type} value={type}>
                {detail.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {actionError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <span>{actionError}</span>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-md"
            onClick={() => setActionError(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      <Card className="rounded-md border-0 gap-0 py-0 shadow-none ring-1 ring-foreground/8">
        {error ? (
          <CardContent className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <AlertTriangle className="size-8 text-destructive" />
            <p className="mt-3 font-medium">Notifications couldn’t be loaded</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              className="mt-4 rounded-md"
              onClick={() => setReloadVersion((value) => value + 1)}
            >
              Try again
            </Button>
          </CardContent>
        ) : loading && !notifications.length ? (
          <CardContent className="space-y-4 p-4 sm:p-5">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex gap-3 border-b pb-4 last:border-0">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48 max-w-full" />
                  <Skeleton className="h-3 w-72 max-w-full" />
                </div>
              </div>
            ))}
          </CardContent>
        ) : notifications.length ? (
          <CardContent className="divide-y divide-border p-0">
            {notifications.map((notification) => {
              const presentation = notificationPresentation[notification.type];
              const Icon = presentation.icon;
              return (
                <article
                  key={notification.id}
                  className={`flex items-start gap-3 px-4 py-4 transition-colors sm:gap-4 sm:px-5 ${
                    notification.isRead ? "bg-card" : "bg-clay/5"
                  }`}
                >
                  <span
                    className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-full ${presentation.tone}`}
                  >
                    <Icon className="size-4" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h2
                        className={`text-sm font-sans ${
                          notification.isRead
                            ? "font-medium"
                            : "font-semibold"
                        }`}
                      >
                        {notification.title}
                      </h2>
                      {!notification.isRead && (
                        <span className="size-1.5 rounded-full bg-clay" />
                      )}
                      <span
                        className={`inline-flex items-center rounded-md border border-current/15 px-2 py-0.5 text-[10px] font-medium ${presentation.tone}`}
                      >
                        {presentation.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      {notification.message}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-xs text-muted-foreground">
                        {notificationTimeLabel(notification.createdAt)}
                      </span>
                      <a
                        href={notification.href}
                        onClick={(event) =>
                          void openNotification(event, notification)
                        }
                        className="text-xs font-semibold text-clay underline-offset-4 hover:underline"
                      >
                        View related activity
                      </a>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 shrink-0 rounded-md px-2 text-xs"
                    aria-label={
                      notification.isRead
                        ? "Mark as unread"
                        : "Mark as read"
                    }
                    onClick={() => void changeReadState(notification)}
                  >
                    {notification.isRead ? (
                      <Bell className="size-3.5" />
                    ) : (
                      <Check className="size-3.5" />
                    )}
                    <span className="hidden sm:inline">
                      {notification.isRead ? "Unread" : "Read"}
                    </span>
                  </Button>
                </article>
              );
            })}
          </CardContent>
        ) : (
          <CardContent className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <Bell className="size-5" />
            </span>
            <p className="mt-4 font-serif text-xl">
              {unreadOnly ? "You’re all caught up" : "No notifications yet"}
            </p>
            <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
              {unreadOnly
                ? "New unread activity will appear here."
                : "New order, inventory, customer, and payment updates will appear here."}
            </p>
          </CardContent>
        )}
        {!error && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-xs text-muted-foreground sm:px-5">
            <span>
              {total
                ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}`
                : "No notifications"}
            </span>
            {pageCount > 1 && (
              <nav aria-label="Notification pages" className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-md"
                  disabled={loading || page === 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft />
                  Previous
                </Button>
                <span>
                  Page {page} of {pageCount}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-md"
                  disabled={loading || page === pageCount}
                  onClick={() =>
                    setPage((value) => Math.min(pageCount, value + 1))
                  }
                  aria-label="Next page"
                >
                  Next
                  <ChevronRight />
                </Button>
              </nav>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
