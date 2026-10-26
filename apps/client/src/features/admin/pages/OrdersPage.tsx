import { useEffect, useState } from "react";
import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Check,
  CircleDollarSign,
  Clock3,
  PackageCheck,
  Package,
  Search,
  ShoppingBag,
  Truck,
} from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { formatPrice } from "@/services/api";
import type { Product } from "@/types/product";
import { SafeImage } from "@/components/motion/SafeImage";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/features/toast/toast-context";
import { apiRequest, authenticatedRequest } from "@/features/auth/auth-client";
import { useAuth } from "@/features/auth/useAuth";

const ORDER_STATUSES = [
  "Order Placed",
  "Confirmed",
  "Processing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];
type StatusFilter = "All orders" | OrderStatus;
const PAGE_SIZE = 5;
type ApiOrderStatus =
  | "placed"
  | "confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

interface AdminOrder {
  id: string;
  orderNumber: string;
  customer: string;
  email: string;
  placedAt: string;
  status: OrderStatus;
  paymentStatus:
    | "Paid"
    | "Awaiting payment"
    | "Pending"
    | "Failed"
    | "Collected";
  paymentMethod: string;
  items: {
    productId: string;
    variantId: string;
    name: string;
    variant: string;
    quantity: number;
    amount: number;
  }[];
  total: number;
  shippingAmount: number;
  address: string[];
  shippingAddress: {
    governorate: string;
    city: string;
    line1: string;
    line2: string;
  };
}

interface OrdersApiOrder {
  id: string;
  orderNumber: string;
  customer: string;
  email: string;
  placedAt: string;
  status: ApiOrderStatus;
  paymentStatus: "paid" | "awaiting_payment" | "pending" | "failed";
  paymentMethod: "stripe" | "cash_on_delivery";
  items: {
    productId: string;
    variantId: string;
    name: string;
    variant: string;
    quantity: number;
    amount: number;
  }[];
  total: number;
  shippingAmount: number;
  address: string[];
  shippingAddress: {
    governorate: string;
    city: string;
    line1: string;
    line2: string;
  };
}

interface OrdersApiResponse {
  orders: OrdersApiOrder[];
  pagination: { page: number; limit: number; total: number; pageCount: number };
  stats: { total: number; paidRevenue: number; toFulfill: number; inTransit: number };
}

const API_STATUS: Record<OrderStatus, ApiOrderStatus> = {
  "Order Placed": "placed",
  Confirmed: "confirmed",
  Processing: "processing",
  Shipped: "shipped",
  "Out for Delivery": "out_for_delivery",
  Delivered: "delivered",
  Cancelled: "cancelled",
};

const DISPLAY_STATUS: Record<ApiOrderStatus, OrderStatus> = {
  placed: "Order Placed",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function presentAdminOrder(
  order: OrdersApiOrder,
  products: Product[],
): AdminOrder {
  const matchesPreviouslyScaledPrices = order.items.every((item) => {
    const product = products.find(
      (candidate) => candidate.id === item.productId,
    );
    const variant = product?.variants?.find(
      (candidate) => candidate.id === item.variantId,
    );
    return variant && item.amount === variant.price * 100;
  });
  const itemTotal = order.items.reduce(
    (total, item) => total + item.amount * item.quantity,
    0,
  );
  const legacyScale =
    matchesPreviouslyScaledPrices && order.total === itemTotal ? 100 : 1;

  return {
    ...order,
    total: order.total / legacyScale,
    items: order.items.map((item) => ({
      ...item,
      amount: item.amount / legacyScale,
    })),
    status: DISPLAY_STATUS[order.status],
    paymentStatus:
      order.paymentStatus === "paid"
        ? "Paid"
        : order.paymentStatus === "awaiting_payment"
          ? "Awaiting payment"
          : order.paymentStatus === "failed"
            ? "Failed"
            : "Pending",
    paymentMethod:
      order.paymentMethod === "cash_on_delivery"
        ? "Cash on delivery"
        : "Card payment",
  };
}

const statusTone: Record<OrderStatus, string> = {
  "Order Placed": "border-slate-200 bg-slate-100 text-slate-700",
  Confirmed: "border-blue-200 bg-blue-50 text-blue-700",
  Processing: "border-amber-200 bg-amber-50 text-amber-800",
  Shipped: "border-violet-200 bg-violet-50 text-violet-700",
  "Out for Delivery": "border-orange-200 bg-orange-50 text-orange-800",
  Delivered: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Cancelled: "border-rose-200 bg-rose-50 text-rose-800",
};

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("en-EG", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge
      variant="outline"
      className={`h-6 rounded-md px-2 text-[11px] font-medium ${statusTone[status]}`}
    >
      {status}
    </Badge>
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
  value: string | number;
  detail: string;
  icon: typeof ShoppingBag;
  tone: string;
}) {
  return (
    <Card className="gap-4 rounded-md border-0 py-4 shadow-none ring-1 ring-foreground/8 sm:gap-5 sm:py-5">
      <CardContent className="flex items-start justify-between gap-3 px-4 sm:px-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
          <p className="mt-1.5 text-xs text-muted-foreground">{detail}</p>
        </div>
        <span className={`grid size-9 shrink-0 place-items-center rounded-md ${tone}`}>
          <Icon className="size-4" strokeWidth={1.8} />
        </span>
      </CardContent>
    </Card>
  );
}

function OrderDetailDialog({
  order,
  products,
  onClose,
}: {
  order: AdminOrder | null;
  products: Product[];
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(order)} onOpenChange={(open) => !open && onClose()}>
      {order && (
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto !rounded-md sm:max-w-2xl">
          <DialogHeader className="border-b border-border pb-4">
            <p className="eyebrow text-clay">Order details</p>
            <DialogTitle className="flex flex-wrap items-center gap-3 pr-8 text-xl font-sans">
              #{order.orderNumber}
              <OrderStatusBadge status={order.status} />
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Placed {formatOrderDate(order.placedAt)}
            </p>
          </DialogHeader>

          <div className="grid gap-5 sm:grid-cols-2">
            <section className="rounded-md border border-border p-4">
              <p className="text-xs font-semibold text-muted-foreground">
                CUSTOMER
              </p>
              <p className="mt-3 text-sm font-medium">{order.customer}</p>
              <p className="mt-1 text-xs text-muted-foreground">{order.email}</p>
            </section>
            <section className="rounded-md border border-border p-4">
              <p className="text-xs font-semibold text-muted-foreground">
                SHIP TO
              </p>
              {order.address.map((line) => (
                <p key={line} className="mt-2 text-sm first:font-medium">
                  {line}
                </p>
              ))}
              <div className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
                <p>
                  Delivery fee:{" "}
                  <span className="font-medium text-foreground">
                    {order.shippingAmount
                      ? formatPrice(order.shippingAmount * 100)
                      : "Complimentary"}
                  </span>
                </p>
              </div>
            </section>
          </div>

          <section>
            <p className="text-xs font-semibold text-muted-foreground">
              ITEMS
            </p>
            <ul className="mt-3 divide-y divide-border rounded-md border border-border px-4">
              {order.items.map((item) => (
                <OrderItemRow
                  key={`${item.name}-${item.variant}`}
                  item={item}
                  products={products}
                />
              ))}
            </ul>
          </section>

          <section className="rounded-md bg-muted/50 p-4">
            <div className="ml-auto max-w-xs space-y-2 text-sm">
              <div className="flex justify-between gap-4 text-muted-foreground">
                <span>Delivery</span>
                <span>{order.shippingAmount ? formatPrice(order.shippingAmount * 100) : "Complimentary"}</span>
              </div>
              <div className="flex justify-between gap-4 border-t border-border pt-2">
                <span className="text-muted-foreground">
                  {order.paymentMethod} · {order.paymentStatus}
                </span>
                <span className="font-semibold tabular">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </section>
        </DialogContent>
      )}
    </Dialog>
  );
}

function OrderItemRow({
  item,
  products,
}: {
  item: AdminOrder["items"][number];
  products: Product[];
}) {
  const product = products.find(
    (candidate) => candidate.name.toLowerCase() === item.name.toLowerCase(),
  );
  const image = product?.images[0];

  return (
    <li className="flex items-center gap-3 py-3 sm:gap-4">
      <div className="size-14 shrink-0 overflow-hidden rounded-md bg-muted sm:size-16">
        {image ? (
          <SafeImage
            src={image}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center text-muted-foreground"
            aria-label={`${item.name} image unavailable`}
          >
            <Package className="size-5" strokeWidth={1.4} />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{item.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {item.variant} · Qty {item.quantity}
        </p>
      </div>
      <span className="shrink-0 text-sm tabular">
        {formatPrice(item.amount * item.quantity)}
      </span>
    </li>
  );
}

function OrdersPageSkeleton() {
  return (
    <div
      aria-label="Loading orders"
      className="space-y-7 animate-pulse"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-11 w-56" />
          <Skeleton className="h-4 w-[30rem] max-w-[85vw]" />
        </div>
        <Skeleton className="h-8 w-36" />
      </div>
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <Card
            key={item}
            className="gap-4 rounded-md border-0 py-4 shadow-none ring-1 ring-foreground/8 sm:py-5"
          >
            <CardContent className="flex justify-between gap-3 px-4 sm:px-5">
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="size-9" />
            </CardContent>
          </Card>
        ))}
      </section>
      <Card className="gap-4 rounded-md border-0 py-5 shadow-none ring-1 ring-foreground/8">
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 sm:w-44" />
          </div>
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
      <Card className="gap-0 overflow-hidden rounded-md border-0 py-0 shadow-none ring-1 ring-foreground/8">
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-6 w-28" />
          </div>
          <div className="hidden grid-cols-7 gap-3 border-b bg-muted/25 px-5 py-3 xl:grid">
            {[0, 1, 2, 3, 4, 5, 6].map((item) => (
              <Skeleton key={item} className="h-3 w-16" />
            ))}
          </div>
          <div className="divide-y divide-border/70">
            {[0, 1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="grid gap-4 px-4 py-4 sm:px-5 xl:grid-cols-[1.1fr_1.4fr_1fr_1fr_1.15fr_1.1fr_auto] xl:items-center xl:gap-3"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="size-11 shrink-0" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-9 w-full xl:w-40" />
                <Skeleton className="hidden size-8 xl:block" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function OrdersPage({ products }: { products: Product[] }) {
  const { toast } = useToast();
  const { csrfToken } = useAuth();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(
    () => new URLSearchParams(window.location.search).get("search") ?? "",
  );
  const [searchOrderId] = useState(
    () => new URLSearchParams(window.location.search).get("orderId") ?? "",
  );
  const [filter, setFilter] = useState<StatusFilter>("All orders");
  const [page, setPage] = useState(1);
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [stats, setStats] = useState<OrdersApiResponse["stats"]>({
    total: 0,
    paidRevenue: 0,
    toFulfill: 0,
    inTransit: 0,
  });
  const [reloadVersion, setReloadVersion] = useState(0);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      sort: sortNewestFirst ? "newest" : "oldest",
    });
    if (searchOrderId) params.set("orderId", searchOrderId);
    const search = query.trim();
    if (search && !searchOrderId) params.set("search", search);
    if (filter !== "All orders") params.set("status", API_STATUS[filter]);

    void apiRequest<OrdersApiResponse>(`/admin/orders?${params.toString()}`)
      .then((response) => {
        if (cancelled) return;
        setOrders(
          response.orders.map((order) => presentAdminOrder(order, products)),
        );
        setTotal(response.pagination.total);
        setPageCount(Math.max(1, response.pagination.pageCount));
        setStats(response.stats);
        if (page > Math.max(1, response.pagination.pageCount))
          setPage(Math.max(1, response.pagination.pageCount));
      })
      .catch((loadError: unknown) => {
        if (!cancelled)
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load orders.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    filter,
    page,
    products,
    query,
    reloadVersion,
    searchOrderId,
    sortNewestFirst,
  ]);

  const currentPage = Math.min(page, pageCount);
  const firstVisibleOrder = total ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const lastVisibleOrder = Math.min(currentPage * PAGE_SIZE, total);
  const pageWindowStart = Math.max(
    1,
    Math.min(currentPage - 2, pageCount - 4),
  );
  const pageNumbers = Array.from(
    { length: Math.min(pageCount, 5) },
    (_, index) => pageWindowStart + index,
  );

  const selectedOrder =
    orders.find((order) => order.id === selectedOrderId) ?? null;

  async function updateStatus(orderId: string, status: OrderStatus) {
    const order = orders.find((current) => current.id === orderId);
    if (!order || order.status === status) return;
    if (!csrfToken) {
      setError("Your session has expired. Sign in again before updating orders.");
      return;
    }

    setUpdatingOrderId(orderId);
    setError(null);
    try {
      const result = await authenticatedRequest<{
        status: ApiOrderStatus;
        changed: boolean;
      }>(`/admin/orders/${encodeURIComponent(orderId)}/status`, csrfToken, {
        method: "PATCH",
        body: JSON.stringify({ status: API_STATUS[status] }),
      });
      setOrders((current) =>
        current.map((currentOrder) =>
          currentOrder.id === orderId
            ? { ...currentOrder, status: DISPLAY_STATUS[result.status] }
            : currentOrder,
        ),
      );
      if (result.changed) {
        toast("Fulfillment status updated", `#${order.orderNumber} is now ${status}.`);
        setReloadVersion((version) => version + 1);
      }
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update fulfillment status.",
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  if (loading) return <OrdersPageSkeleton />;

  return (
    <div className="space-y-7">
      <PageHeader
        title="Orders"
        description="Review customer purchases, keep fulfillment moving, and update each delivery as it progresses."
      />
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <section
        aria-label="Order overview"
        className="grid grid-cols-2 gap-3 xl:grid-cols-4"
      >
        <SummaryCard
          label="Total orders"
          value={stats.total}
          detail="Across all customer orders"
          icon={ShoppingBag}
          tone="bg-blue-500/10 text-blue-700"
        />
        <SummaryCard
          label="To fulfill"
          value={stats.toFulfill}
          detail="Need a fulfillment step"
          icon={PackageCheck}
          tone="bg-amber-500/10 text-amber-700"
        />
        <SummaryCard
          label="In transit"
          value={stats.inTransit}
          detail="On the way to customers"
          icon={Truck}
          tone="bg-violet-500/10 text-violet-700"
        />
        <SummaryCard
          label="Paid revenue"
          value={formatPrice(stats.paidRevenue)}
          detail="From paid orders"
          icon={CircleDollarSign}
          tone="bg-emerald-500/10 text-emerald-700"
        />
      </section>

      <Card className="gap-4 rounded-md border-0 py-4 shadow-none ring-1 ring-foreground/8 sm:py-5">
        <CardContent className="space-y-4 px-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-10 bg-background pl-9"
                placeholder="Search order number, customer, or email"
                aria-label="Search orders"
                value={query}
                onChange={(event) => {
                  setLoading(true);
                  setError(null);
                  setOrders([]);
                  setQuery(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-10 justify-start rounded-md sm:w-44"
              onClick={() => {
                setLoading(true);
                setError(null);
                setOrders([]);
                setSortNewestFirst((value) => !value);
              }}
            >
              <ArrowDownUp className="size-4" />
              {sortNewestFirst ? "Newest first" : "Oldest first"}
            </Button>
          </div>

          <div className="flex flex-col justify-between gap-3 border-t border-border pt-4 sm:flex-row sm:items-center">
            <p className="text-xs text-muted-foreground">
              {total
                ? `Showing ${firstVisibleOrder}–${lastVisibleOrder} of ${total} orders`
                : "No orders match the current filters"}
            </p>
            <Select
              value={filter}
              onValueChange={(value) => {
                setLoading(true);
                setError(null);
                setOrders([]);
                setFilter(value as StatusFilter);
                setPage(1);
              }}
            >
              <SelectTrigger
                className="h-9 w-full rounded-md bg-background px-3 sm:w-52"
                aria-label="Filter by fulfillment status"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                <SelectItem className="rounded-md" value="All orders">
                  All statuses
                </SelectItem>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem
                    key={status}
                    className="rounded-md"
                    value={status}
                  >
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden rounded-md border-0 py-0 shadow-none ring-1 ring-foreground/8">
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
            <div>
              <p className="text-sm font-medium">Order management</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Select a status to update fulfillment manually.
              </p>
            </div>
          </div>

          <div className="hidden grid-cols-[1.1fr_1.4fr_1fr_1fr_1.15fr_1.1fr_auto] items-center gap-3 border-b bg-muted/25 px-5 py-3 text-xs font-medium text-muted-foreground xl:grid">
            <span>Order</span>
            <span>Customer</span>
            <span>Date</span>
            <span>Amount</span>
            <span>Payment</span>
            <span>Fulfillment</span>
            <span />
          </div>

          {orders.length ? (
            <ul className="divide-y divide-border/70">
              {orders.map((order) => (
                <li
                  key={order.id}
                  className="grid gap-4 px-4 py-4 transition-colors hover:bg-muted/20 sm:px-5 xl:grid-cols-[1.1fr_1.4fr_1fr_1fr_1.15fr_1.1fr_auto] xl:items-center xl:gap-3"
                >
                  <div className="flex items-center justify-between gap-3 xl:block">
                    <div>
                      <button
                        type="button"
                        onClick={() => setSelectedOrderId(order.id)}
                        className="text-sm font-semibold text-foreground underline-offset-4 hover:text-clay hover:underline"
                      >
                        #{order.orderNumber}
                      </button>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {order.items.reduce(
                          (sum, item) => sum + item.quantity,
                          0,
                        )}{" "}
                        items
                      </p>
                      <div className="my-2 flex -space-x-2">
                        {order.items.slice(0, 3).map((item) => {
                          const product = products.find(
                            (candidate) =>
                              candidate.name.toLowerCase() ===
                              item.name.toLowerCase(),
                          );
                          return (
                            <span
                              key={`${item.name}-${item.variant}`}
                              className="size-7 overflow-hidden rounded-md border-2 border-card bg-muted"
                              title={item.name}
                            >
                              {product?.images[0] ? (
                                <SafeImage
                                  src={product.images[0]}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="flex h-full items-center justify-center text-muted-foreground">
                                  <Package className="size-3.5" />
                                </span>
                              )}
                            </span>
                          );
                        })}
                        {order.items.length > 3 && (
                          <span className="flex size-7 items-center justify-center rounded-md border-2 border-card bg-muted text-[9px] font-medium text-muted-foreground">
                            +{order.items.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {order.customer}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {order.email}
                    </p>
                  </div>

                  <div className="flex justify-between gap-4 xl:block">
                    <span className="text-xs text-muted-foreground xl:hidden">
                      Placed
                    </span>
                    <time
                      dateTime={order.placedAt}
                      className="text-xs text-foreground/80"
                    >
                      {formatOrderDate(order.placedAt)}
                    </time>
                  </div>

                  <div className="flex justify-between gap-4 xl:block">
                    <span className="text-xs text-muted-foreground xl:hidden">
                      Total
                    </span>
                    <div className="xl:space-y-1">
                      <p className="text-sm font-medium tabular">
                        {formatPrice(order.total)}
                      </p>
                      <p className="max-w-40 truncate text-[11px] text-muted-foreground">
                        Delivery ·{" "}
                        {order.shippingAddress.governorate ||
                          order.shippingAddress.city ||
                          "Address unavailable"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {order.shippingAmount
                          ? formatPrice(order.shippingAmount * 100)
                          : "Complimentary delivery"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 xl:block">
                    <span className="text-xs text-muted-foreground xl:hidden">
                      Payment
                    </span>
                    <div className="text-right xl:text-left">
                      <p className="text-xs font-medium">{order.paymentStatus}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {order.paymentMethod}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 xl:block">
                    <span className="text-xs text-muted-foreground xl:hidden">
                      Fulfillment status
                    </span>
                    <Select
                      value={order.status}
                      onValueChange={(value) =>
                        void updateStatus(order.id, value as OrderStatus)
                      }
                    >
                      <SelectTrigger
                        className="h-9 w-full rounded-md bg-background px-2.5 text-xs xl:min-w-40"
                        aria-label={`Update status for order ${order.id}`}
                        disabled={updatingOrderId === order.id}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-md">
                        {ORDER_STATUSES.map((status) => (
                          <SelectItem
                            key={status}
                            className="rounded-md"
                            value={status}
                          >
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="button"
                    variant="default"
                    size="default"
                    className="hidden h-9 rounded-full xl:inline-flex"
                    onClick={() => setSelectedOrderId(order.id)}
                    aria-label={`View order ${order.id}`}
                  >
                    <ArrowRight className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex min-h-56 flex-col items-center justify-center px-5 py-10 text-center">
              <Clock3 className="size-7 text-muted-foreground" strokeWidth={1.5} />
              <p className="mt-3 font-medium">
                {error ? "Orders could not be loaded" : "No matching orders"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {error
                  ? "Try refreshing the page. If the problem continues, contact support."
                  : "Try another search term or fulfillment status."}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 border-t bg-muted/15 px-4 py-3 text-xs text-muted-foreground sm:px-5">
            <span>
              Showing {firstVisibleOrder}–{lastVisibleOrder} of{" "}
              {total} matching orders
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-3.5 text-emerald-700" />
              Fulfillment updates are saved
            </span>
          </div>
          {total > PAGE_SIZE && (
            <nav
              aria-label="Order pages"
              className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 sm:px-5"
            >
              <p className="text-xs text-muted-foreground">
                Page {currentPage} of {pageCount}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 rounded-md px-2.5"
                  disabled={loading || currentPage === 1}
                  onClick={() => {
                    setLoading(true);
                    setOrders([]);
                    setPage((value) => Math.max(1, value - 1));
                  }}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="size-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                {                pageNumbers.map((pageNumber) => (
                    <Button
                      key={pageNumber}
                      type="button"
                      variant={pageNumber === currentPage ? "default" : "ghost"}
                      size="sm"
                      className="size-8 rounded-md p-0"
                      disabled={loading}
                      aria-label={`Page ${pageNumber}`}
                      aria-current={
                        pageNumber === currentPage ? "page" : undefined
                      }
                      onClick={() => {
                        setLoading(true);
                        setOrders([]);
                        setPage(pageNumber);
                      }}
                    >
                      {pageNumber}
                    </Button>
                  ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 rounded-md px-2.5"
                  disabled={loading || currentPage === pageCount}
                  onClick={() => {
                    setLoading(true);
                    setOrders([]);
                    setPage((value) => Math.min(pageCount, value + 1));
                  }}
                  aria-label="Next page"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </nav>
          )}
        </CardContent>
      </Card>

      <OrderDetailDialog
        order={selectedOrder}
        products={products}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  );
}
