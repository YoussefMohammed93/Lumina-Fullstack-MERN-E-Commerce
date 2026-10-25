import {
  ArrowUpRight,
  ChevronRight,
  CircleAlert,
  CircleDollarSign,
  CreditCard,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { formatPrice } from "@/services/api";
import type { AdminDashboardOverview } from "../admin-dashboard-service";

const palette = {
  green: { backgroundColor: "#dcfce7", color: "#15803d" },
  blue: { backgroundColor: "#dbeafe", color: "#1d4ed8" },
  violet: { backgroundColor: "#ede9fe", color: "#6d28d9" },
  amber: { backgroundColor: "#fef3c7", color: "#b45309" },
  red: { backgroundColor: "#fee2e2", color: "#b91c1c" },
};

const metricIcons = {
  "Paid revenue": {
    icon: CircleDollarSign,
    tone: "bg-emerald-500/10 text-emerald-700",
  },
  Orders: { icon: ShoppingBag, tone: "bg-blue-500/10 text-blue-700" },
  Customers: { icon: Users, tone: "bg-violet-500/10 text-violet-700" },
  "Products sold": { icon: Package, tone: "bg-amber-500/10 text-amber-700" },
};

interface DashboardPageProps {
  userName: string;
  overview: AdminDashboardOverview | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function DashboardContentSkeleton() {
  return (
    <>
      <section
        className="grid grid-cols-2 gap-3 xl:grid-cols-4"
        aria-label="Loading overview metrics"
      >
        {Array.from({ length: 4 }, (_, index) => (
          <Card
            key={index}
            className="gap-4 rounded-md border-0 py-4 shadow-none ring-1 ring-foreground/8 sm:gap-5 sm:py-5"
          >
            <CardContent className="flex items-start justify-between gap-3 px-4 sm:px-5">
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-36" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="size-9 shrink-0 rounded-md" />
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.75fr)]">
        <Card className="rounded-md border-0 shadow-none ring-1 ring-foreground/8">
          <CardHeader className="flex-row items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="mt-2 h-6 w-24 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="flex h-52 items-end gap-2 pt-4" aria-hidden="true">
              {[35, 55, 42, 70, 50, 85].map((height, index) => (
                <div key={index} className="flex h-full flex-1 items-end">
                  <Skeleton
                    className="w-full rounded-t-md"
                    style={{ height: `${height}%` }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md border-0 bg-card text-card-foreground shadow-none ring-1 ring-foreground/8">
          <CardHeader className="space-y-2">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-md px-2 py-2.5"
              >
                <span className="flex items-center gap-2.5">
                  <Skeleton className="size-7 rounded-full" />
                  <Skeleton className="h-4 w-36" />
                </span>
                <Skeleton className="h-7 w-8" />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-md border-0 shadow-none ring-1 ring-foreground/8">
        <CardHeader className="admin-orders-header">
          <div className="space-y-2">
            <Skeleton className="h-8 w-44" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-full rounded-xl sm:w-24" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="rounded-md border border-border bg-background p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-36" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export function DashboardPage({
  userName,
  overview,
  loading,
  error,
  onRetry,
}: DashboardPageProps) {
  const revenueLabel =
    overview === null ? "—" : formatPrice(overview.paidRevenue);
  const loadingDetail = loading ? "Loading…" : "Data unavailable";
  const ordersToFulfill = overview?.ordersToFulfill;
  const newCustomers = overview?.newCustomers;
  const productsSold = overview?.productsSold;
  const metrics = [
    {
      label: "Paid revenue",
      value: revenueLabel,
      detail: overview
        ? overview.paidRevenue > 0
          ? "From paid orders, including delivered cash on delivery"
          : "No paid revenue recorded yet"
        : loadingDetail,
      ...metricIcons["Paid revenue"],
    },
    {
      label: "Orders",
      value: overview?.totalOrders.toLocaleString() ?? "—",
      detail:
        ordersToFulfill === undefined
          ? loadingDetail
          : ordersToFulfill === 0
            ? "All orders are fulfilled"
            : `${ordersToFulfill.toLocaleString()} order${ordersToFulfill === 1 ? "" : "s"} to fulfil`,
      ...metricIcons.Orders,
    },
    {
      label: "Customers",
      value: overview?.totalCustomers.toLocaleString() ?? "—",
      detail:
        newCustomers === undefined
          ? loadingDetail
          : newCustomers === 0
            ? "No new customers in the last 7 days"
            : `${newCustomers.toLocaleString()} new customer${newCustomers === 1 ? "" : "s"} in the last 7 days`,
      ...metricIcons.Customers,
    },
    {
      label: "Products sold",
      value: overview?.productsSold.toLocaleString() ?? "—",
      detail:
        productsSold === undefined
          ? loadingDetail
          : productsSold === 0
            ? "No units sold yet"
            : `${productsSold.toLocaleString()} unit${productsSold === 1 ? "" : "s"} across paid and COD orders`,
      ...metricIcons["Products sold"],
    },
  ];
  const tasks = [
    {
      count: overview?.ordersToFulfill.toLocaleString() ?? "—",
      label: "Orders to fulfil",
      icon: ShoppingBag,
      tone: palette.amber,
      href: "/admin/orders",
    },
    {
      count: overview?.lowStockProducts.toLocaleString() ?? "—",
      label: "Products low in stock",
      icon: CircleAlert,
      tone: palette.red,
      href: "/admin/products",
    },
    {
      count: overview?.failedPayments.toLocaleString() ?? "—",
      label: "Failed payments",
      icon: CreditCard,
      tone: palette.blue,
      href: "/admin/orders",
    },
    {
      count: overview?.newCustomers.toLocaleString() ?? "—",
      label: "New customers this week",
      icon: Users,
      tone: palette.violet,
      href: "/admin/customers",
    },
  ];
  const maxRevenue = Math.max(
    ...(overview?.revenueByMonth.map((month) => month.amount) ?? []),
    1,
  );

  if (loading) {
    return (
      <div className="space-y-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="mt-2 h-12 w-[min(38rem,90vw)] md:h-[3.75rem]" />
            <Skeleton className="mt-3 h-4 w-[min(32rem,90vw)]" />
          </div>
          <Skeleton className="h-11 w-32 shrink-0 rounded-xl" />
        </div>
        <DashboardContentSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title={`Good morning, ${userName}.`}
        description={
          overview
            ? `Here's the latest from your store. You have ${overview.ordersToFulfill.toLocaleString()} orders waiting to be fulfilled.`
            : "Here's the latest from your store."
        }
        action={
          <Button className="rounded-xl" asChild>
            <a href="/admin/products">
              Add product <ArrowUpRight />
            </a>
          </Button>
        }
      />
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}{" "}
          <button
            type="button"
            className="ml-1 font-semibold underline underline-offset-2"
            onClick={onRetry}
          >
            Try again
          </button>
        </p>
      )}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card
              key={metric.label}
              className="gap-4 rounded-md border-0 py-4 shadow-none ring-1 ring-foreground/8 sm:gap-5 sm:py-5"
            >
              <CardContent className="flex items-start justify-between gap-3 px-4 sm:px-5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.label}
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight">
                    {metric.value}
                  </p>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {metric.detail}
                  </p>
                </div>
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-md ${metric.tone}`}
                >
                  <Icon className="size-4" strokeWidth={1.8} />
                </span>
              </CardContent>
            </Card>
          );
        })}
      </section>
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.75fr)]">
        <Card className="rounded-md border-0 shadow-none ring-1 ring-foreground/8">
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle className="text-2xl sm:text-3xl">
                Paid revenue overview
              </CardTitle>
              <p className="mt-1 text-xs sm:text-sm font-medium text-muted-foreground">
                Monthly paid orders
              </p>
            </div>
            <Badge variant="secondary" className="font-semibold mt-2">
              {revenueLabel}
            </Badge>
          </CardHeader>
          <CardContent>
            <div
              className="flex h-52 items-end gap-2 pt-4"
              aria-label="Monthly paid revenue chart"
            >
              {(overview?.revenueByMonth ?? []).map((month) => {
                const height = Math.max((month.amount / maxRevenue) * 100, 2);
                return (
                  <div
                    key={month.label}
                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                    title={`${month.label}: ${formatPrice(month.amount)}`}
                  >
                    <div
                      style={{
                        height: `${height}%`,
                        backgroundColor:
                          month === overview?.revenueByMonth.at(-1)
                            ? "var(--primary)"
                            : "var(--secondary)",
                      }}
                      className="w-full rounded-t-md transition-opacity hover:opacity-70"
                    />
                    <span className="truncate text-[11px] font-medium text-muted-foreground">
                      {month.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-md border-0 bg-card text-card-foreground shadow-none ring-1 ring-foreground/8">
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle className="text-2xl sm:text-3xl">
                Store pulse
              </CardTitle>
              <p className="mt-1 text-xs sm:text-sm font-medium text-muted-foreground">
                Your team's to-do list
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.map(({ count, label, icon: Icon, tone, href }) => (
              <a
                href={href}
                key={label}
                className="flex items-center justify-between rounded-md px-2 py-2.5 transition-colors hover:bg-muted"
              >
                <span className="flex items-center gap-2.5 text-sm font-medium text-foreground">
                  <span
                    className="grid size-7 place-items-center rounded-full"
                    style={tone}
                  >
                    <Icon className="size-3.5" strokeWidth={2} />
                  </span>
                  {label}
                </span>
                <span className="flex items-center gap-2 font-serif text-2xl">
                  {count}
                  <ChevronRight className="size-4" />
                </span>
              </a>
            ))}
          </CardContent>
        </Card>
      </section>
      <Card className="rounded-md border-0 shadow-none ring-1 ring-foreground/8">
        <CardHeader className="admin-orders-header">
          <div>
            <CardTitle className="text-2xl sm:text-3xl">
              Recent orders
            </CardTitle>
            <p className="mt-1 text-xs sm:text-sm font-medium text-muted-foreground">
              Your four newest sales, ready for the next action.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="admin-orders-header__action w-full rounded-xl font-semibold"
            asChild
          >
            <a href="/admin/orders">View all</a>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {(overview?.recentOrders ?? []).map((order, index) => {
              const tone =
                order.fulfillmentStatus === "delivered"
                  ? palette.green
                  : order.fulfillmentStatus === "cancelled" ||
                      order.paymentStatus === "failed"
                    ? palette.red
                    : order.fulfillmentStatus === "processing" ||
                        order.fulfillmentStatus === "confirmed"
                      ? palette.blue
                      : palette.amber;
              const fulfillmentLabel = order.fulfillmentStatus
                .replaceAll("_", " ")
                .replace(/\b\w/g, (letter) => letter.toUpperCase());

              return (
                <a
                  href={`/admin/orders?search=${encodeURIComponent(order.orderNumber)}`}
                  key={order.id}
                  className="group rounded-md border border-border bg-background p-4 transition-colors hover:bg-muted"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="grid size-10 place-items-center rounded-full text-sm font-semibold"
                        style={[palette.violet, palette.blue, palette.amber, palette.green][index]}
                      >
                        {order.customer.slice(0, 1)}
                      </span>
                      <div>
                        <p className="font-semibold">{order.customer}</p>
                        <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                          {order.orderNumber} · {order.itemCount}{" "}
                          {order.itemCount === 1 ? "item" : "items"}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className="border-0 font-semibold capitalize"
                      style={tone}
                    >
                      {fulfillmentLabel}
                    </Badge>
                  </div>
                  <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
                    <div>
                      <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        Order total
                      </p>
                      <p className="mt-1 tabular text-lg font-semibold">
                        {formatPrice(order.total, order.currency)}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors group-hover:text-foreground">
                      Open order <ChevronRight className="size-3.5" />
                    </span>
                  </div>
                </a>
              );
            })}
            {overview && overview.recentOrders.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground md:col-span-2">
                No orders have been placed yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
