import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  ChevronDown,
  Eye,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldOff,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  X,
} from "lucide-react";
import { apiRequest, authenticatedRequest } from "@/features/auth/auth-client";
import { useAuth } from "@/features/auth/useAuth";
import { formatPrice } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { useToast } from "@/features/toast/ToastProvider";
import { CustomerDetailDialog } from "@/features/admin/components/CustomerDetailDialog";

// ── Types ──────────────────────────────────────────────────────────────

interface Customer {
  id: string;
  username: string;
  name?: string;
  email: string;
  avatarUrl?: string;
  role: "user" | "admin";
  status: "active" | "disabled";
  createdAt: string;
  orderCount: number;
  totalSpent: number;
}

interface CustomerStats {
  total: number;
  active: number;
  disabled: number;
  newThisMonth: number;
}

interface CustomersResponse {
  customers: Customer[];
  stats: CustomerStats;
}

// ── Helpers ────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years >= 1) return `${years}y ago`;
  if (months >= 1) return `${months}mo ago`;
  if (days >= 1) return `${days}d ago`;
  if (hours >= 1) return `${hours}h ago`;
  if (minutes >= 1) return `${minutes}m ago`;
  return "Just now";
}

function initials(customer: Customer): string {
  if (customer.name) {
    const parts = customer.name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return customer.username.slice(0, 2).toUpperCase();
}

const initialsColors = [
  "bg-blue-500/10 text-blue-700",
  "bg-emerald-500/10 text-emerald-700",
  "bg-violet-500/10 text-violet-700",
  "bg-amber-500/10 text-amber-700",
  "bg-rose-500/10 text-rose-700",
  "bg-pink-500/10 text-pink-700",
  "bg-indigo-500/10 text-indigo-700",
  "bg-teal-500/10 text-teal-700",
];

function colorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++)
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  return initialsColors[Math.abs(hash) % initialsColors.length];
}

// ── Sort options ───────────────────────────────────────────────────────

type SortKey = "newest" | "oldest" | "orders" | "spend";
type StatusFilter = "all" | "active" | "disabled";

function sortCustomers(list: Customer[], key: SortKey): Customer[] {
  const sorted = [...list];
  switch (key) {
    case "newest":
      return sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    case "oldest":
      return sorted.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    case "orders":
      return sorted.sort((a, b) => b.orderCount - a.orderCount);
    case "spend":
      return sorted.sort((a, b) => b.totalSpent - a.totalSpent);
    default:
      return sorted;
  }
}

// ── Component ──────────────────────────────────────────────────────────

export function CustomersPage() {
  const { csrfToken } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<CustomersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────

  const load = async () => {
    setError("");
    try {
      const result =
        await apiRequest<CustomersResponse>("/admin/customers");
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load customers.",
      );
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
    apiRequest<CustomersResponse>("/admin/customers")
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Unable to load customers.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Toggle status ──────────────────────────────────────────────────

  const toggleStatus = useCallback(
    async (customer: Customer) => {
      if (!csrfToken) {
        setError("Your session has expired. Please sign in again.");
        return;
      }
      const newStatus = customer.status === "active" ? "disabled" : "active";
      setTogglingId(customer.id);
      setError("");
      try {
        await authenticatedRequest(
          `/admin/customers/${customer.id}/status`,
          csrfToken,
          {
            method: "PATCH",
            body: JSON.stringify({ status: newStatus }),
          },
        );
        setData((prev) => {
          if (!prev) return prev;
          const updatedCustomers = prev.customers.map((c) =>
            c.id === customer.id
              ? { ...c, status: newStatus as "active" | "disabled" }
              : c,
          );
          const active = updatedCustomers.filter(
            (c) => c.status === "active",
          ).length;
          return {
            customers: updatedCustomers,
            stats: {
              ...prev.stats,
              active,
              disabled: prev.stats.total - active,
            },
          };
        });
        toast(
          `Account ${newStatus === "active" ? "enabled" : "disabled"}`,
          customer.name || customer.username,
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not update status.",
        );
      } finally {
        setTogglingId(null);
      }
    },
    [csrfToken, toast],
  );

  // ── Filtered + sorted list ─────────────────────────────────────────

  const customers = useMemo(() => {
    if (!data) return [];
    let list = data.customers;

    if (filter !== "all") {
      list = list.filter((c) => c.status === filter);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (c) =>
          (c.name || "").toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.username.toLowerCase().includes(q),
      );
    }

    return sortCustomers(list, sort);
  }, [data, filter, query, sort]);

  const stats = data?.stats;

  const counts = useMemo(
    () => ({
      all: data?.customers.length ?? 0,
      active: stats?.active ?? 0,
      disabled: stats?.disabled ?? 0,
    }),
    [data, stats],
  );

  // ── Render ─────────────────────────────────────────────────────────

  if (loading) return <CustomersPageSkeleton />;

  return (
    <TooltipProvider delay={500}>
      <div className="space-y-6 sm:space-y-7">
        <PageHeader
          title="Customers"
          description="View customer profiles, order history, and lifetime value."
        />

        {error && (
          <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {/* ── Summary cards ─────────────────────────────────────── */}
        <section
          aria-label="Customer overview"
          className="grid grid-cols-2 gap-3 xl:grid-cols-4"
        >
          <SummaryCard
            label="Total customers"
            value={stats?.total ?? 0}
            detail="Across all accounts"
            icon={Users}
            tone="text-primary bg-primary/10 !rounded-full"
          />
          <SummaryCard
            label="Active"
            value={stats?.active ?? 0}
            detail="Can browse & order"
            icon={UserCheck}
            tone="text-emerald-700 bg-emerald-500/10 !rounded-full"
          />
          <SummaryCard
            label="New this month"
            value={stats?.newThisMonth ?? 0}
            detail="Signed up recently"
            icon={UserPlus}
            tone="text-blue-700 bg-blue-500/10 !rounded-full"
          />
          <SummaryCard
            label="Disabled"
            value={stats?.disabled ?? 0}
            detail="Restricted access"
            icon={UserX}
            tone="text-muted-foreground bg-muted !rounded-full"
          />
        </section>

        {/* ── Toolbar card ──────────────────────────────────────── */}
        <Card className="gap-4 border-0 py-4 shadow-none ring-1 ring-foreground/8 sm:gap-5 sm:py-5">
          <CardContent className="space-y-4 px-4 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="bg-background pl-9 pr-9 h-10"
                  placeholder="Search by name, email, or username"
                  aria-label="Search customers"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
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
                  onValueChange={(v) => setSort(v as SortKey)}
                >
                  <SelectTrigger
                    className="h-9 min-w-0 rounded-md bg-background px-3 sm:w-48"
                    aria-label="Sort customers"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-md">
                    <SelectItem className="rounded-md" value="newest">
                      Newest first
                    </SelectItem>
                    <SelectItem className="rounded-md" value="oldest">
                      Oldest first
                    </SelectItem>
                    <SelectItem className="rounded-md" value="orders">
                      Most orders
                    </SelectItem>
                    <SelectItem className="rounded-md" value="spend">
                      Highest spend
                    </SelectItem>
                  </SelectContent>
                </Select>
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
                      aria-label="Refresh customers"
                    >
                      <RefreshCw className={loading ? "animate-spin" : ""} />
                    </Button>
                  }
                />
                <TooltipContent>Refresh customers</TooltipContent>
              </Tooltip>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {counts[filter]}
                </span>{" "}
                {filter === "all" ? "customers" : filter}
              </p>
              <Select
                value={filter}
                onValueChange={(v) => setFilter(v as StatusFilter)}
              >
                <SelectTrigger
                  className="h-9 w-full rounded-md bg-background px-3 sm:w-52"
                  aria-label="Filter by status"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  <SelectItem className="rounded-md" value="all">
                    All customers
                  </SelectItem>
                  <SelectItem className="rounded-md" value="active">
                    Active
                  </SelectItem>
                  <SelectItem className="rounded-md" value="disabled">
                    Disabled
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ── Customer table card ───────────────────────────────── */}
        <Card className="gap-0 overflow-hidden rounded-md border-0 py-0 shadow-none ring-1 ring-foreground/8">
          <CardContent className="p-0">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
              <p className="text-sm font-medium">
                {`${customers.length} ${customers.length === 1 ? "customer" : "customers"}`}
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

            {/* Table header — desktop */}
            {customers.length > 0 && (
              <div className="customers-table-header hidden items-center gap-3 border-b bg-muted/25 px-5 py-3 text-xs font-medium text-muted-foreground lg:grid">
                <span className="customers-cell-customer">Customer</span>
                <span className="customers-cell-status">Status</span>
                <span className="customers-cell-orders">Orders</span>
                <span className="customers-cell-spend">Total spent</span>
                <span className="customers-cell-joined">Joined</span>
                <span className="customers-cell-actions">Actions</span>
              </div>
            )}

            {/* Table rows */}
            <div className="divide-y divide-border/70">
              {customers.map((customer) => (
                <CustomerRow
                  key={customer.id}
                  customer={customer}
                  onView={() => setSelectedCustomer(customer)}
                  onToggle={() => void toggleStatus(customer)}
                  busy={togglingId === customer.id}
                />
              ))}
              {customers.length === 0 && (
                <div className="col-span-full flex flex-col items-center px-5 py-12 text-center">
                  <span className="mb-3 flex size-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Search className="size-5" />
                  </span>
                  <p className="font-medium">
                    {(data?.customers.length ?? 0) === 0
                      ? "No customers yet"
                      : "No matching customers"}
                  </p>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    {(data?.customers.length ?? 0) === 0
                      ? "Customers will appear here once they sign up."
                      : "Try another search or clear your filters to see more customers."}
                  </p>
                  {(data?.customers.length ?? 0) > 0 && (
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

        {/* ── Customer detail dialog ──────────────────────────── */}
        <CustomerDetailDialog
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onToggleStatus={toggleStatus}
          togglingId={togglingId}
        />
      </div>
    </TooltipProvider>
  );
}

// ── SummaryCard ──────────────────────────────────────────────────────

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
  icon: typeof Users;
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
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-md sm:size-10 ${tone}`}
        >
          <Icon className="size-4 sm:size-5" />
        </span>
      </CardContent>
    </Card>
  );
}

// ── CustomerRow ──────────────────────────────────────────────────────

function CustomerRow({
  customer,
  onView,
  onToggle,
  busy,
}: {
  customer: Customer;
  onView: () => void;
  onToggle: () => void;
  busy: boolean;
}) {
  const avatarTone = colorForId(customer.id);
  const statusTone =
    customer.status === "active"
      ? "bg-emerald-500/10 text-emerald-700"
      : "bg-muted text-muted-foreground";

  return (
    <div className="customers-table-row group items-center gap-x-3 gap-y-2 px-4 py-3 transition-colors hover:bg-muted/40 sm:px-5">
      {/* Avatar + Name + Email */}
      <div className="customers-cell-customer flex min-w-0 items-center gap-3">
        <Avatar className="size-10 shrink-0">
          {customer.avatarUrl ? (
            <AvatarImage
              src={customer.avatarUrl}
              alt={customer.name || customer.username}
            />
          ) : null}
          <AvatarFallback className={`text-xs font-semibold ${avatarTone}`}>
            {initials(customer)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {customer.name || customer.username}
          </p>
          <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
            {customer.email}
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="customers-cell-status">
        <Badge
          className={`border-0 font-medium ${statusTone}`}
        >
          {customer.status === "active" ? "Active" : "Disabled"}
        </Badge>
      </div>

      <div className="customers-mobile-details flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground lg:hidden">
        <span>
          <span className="font-medium text-foreground">Orders:</span>{" "}
          {customer.orderCount}
        </span>
        <span>
          <span className="font-medium text-foreground">Spent:</span>{" "}
          {formatPrice(customer.totalSpent)}
        </span>
        <span>
          <span className="font-medium text-foreground">Joined:</span>{" "}
          {relativeTime(customer.createdAt)}
        </span>
      </div>

      {/* Full-width table metrics */}
      <div className="customers-cell-orders hidden text-center lg:block">
        <p className="text-sm tabular font-medium">{customer.orderCount}</p>
      </div>
      <div className="customers-cell-spend hidden text-center lg:block">
        <p className="text-sm tabular font-medium">
          {formatPrice(customer.totalSpent)}
        </p>
      </div>
      <div className="customers-cell-joined hidden text-center lg:block">
        <p className="text-xs text-muted-foreground">
          {relativeTime(customer.createdAt)}
        </p>
      </div>

      {/* Actions */}
      <div className="customers-cell-actions flex shrink-0 items-center gap-1">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="default"
                className="rounded-full !size-10"
                onClick={onView}
                aria-label={`View ${customer.name || customer.username}`}
              >
                <Eye />
              </Button>
            }
          />
          <TooltipContent>View profile</TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="default"
              className="rounded-full !size-10"
              aria-label="More actions"
            >
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-md w-40">
            <DropdownMenuItem
              className="rounded-md gap-2"
              onClick={onView}
            >
              <Eye className="size-4" />
              View profile
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-md gap-2"
              onClick={onToggle}
              disabled={busy}
            >
              {customer.status === "active" ? (
                <>
                  <ShieldOff className="size-4" />
                  Disable account
                </>
              ) : (
                <>
                  <ShieldCheck className="size-4" />
                  Enable account
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────

function CustomersPageSkeleton() {
  return (
    <div
      className="space-y-6 sm:space-y-7"
      aria-busy="true"
      aria-label="Loading customers"
    >
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-10 w-48 md:h-12 md:w-56" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
        </div>
      </div>

      {/* Summary cards skeleton */}
      <section
        className="grid grid-cols-2 gap-3 xl:grid-cols-4"
        aria-hidden="true"
      >
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

      {/* Toolbar skeleton */}
      <Card className="gap-4 border-0 py-4 shadow-none ring-1 ring-foreground/8 sm:gap-5 sm:py-5">
        <CardContent className="space-y-4 px-4 sm:px-5" aria-hidden="true">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Skeleton className="h-10 min-w-0 flex-1" />
            <Skeleton className="h-10 w-full sm:w-48" />
            <Skeleton className="hidden size-10 sm:block" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-full sm:w-52" />
          </div>
        </CardContent>
      </Card>

      {/* Table skeleton */}
      <Card className="gap-0 overflow-hidden rounded-md border-0 py-0 shadow-none ring-1 ring-foreground/8">
        <CardContent className="p-0" aria-hidden="true">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20 sm:hidden" />
          </div>
          <div className="hidden gap-3 border-b bg-muted/25 px-5 py-3 lg:grid customers-table-header">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-3 w-16" />
            ))}
          </div>
          <div className="divide-y divide-border/70">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 sm:px-5"
              >
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="hidden h-5 w-16 rounded-full sm:block" />
                <Skeleton className="hidden h-4 w-12 md:block" />
                <Skeleton className="hidden h-4 w-20 md:block" />
                <Skeleton className="hidden h-4 w-16 md:block" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
