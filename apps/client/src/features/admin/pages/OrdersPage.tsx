import { useEffect, useMemo, useState } from "react";
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
import { useToast } from "@/features/toast/ToastProvider";

const ORDER_STATUSES = [
  "Order Placed",
  "Confirmed",
  "Processing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];
type StatusFilter = "All orders" | OrderStatus;
const PAGE_SIZE = 5;

interface AdminOrder {
  id: string;
  customer: string;
  email: string;
  placedAt: string;
  status: OrderStatus;
  paymentStatus: "Paid" | "Awaiting payment" | "Collected";
  paymentMethod: string;
  items: { name: string; variant: string; quantity: number; amount: number }[];
  total: number;
  address: string[];
}

const INITIAL_ORDERS: AdminOrder[] = [
  {
    id: "LM-2048",
    customer: "Mariam Abdelrahman",
    email: "mariam.a@example.com",
    placedAt: "2026-10-24T10:42:00",
    status: "Out for Delivery",
    paymentStatus: "Paid",
    paymentMethod: "Visa ending in 4242",
    items: [
      {
        name: "Sculpted Ceramic Vase",
        variant: "Warm ivory · Medium",
        quantity: 1,
        amount: 84500,
      },
      {
        name: "Linen Cushion Cover",
        variant: "Natural flax · 50 × 50 cm",
        quantity: 2,
        amount: 32500,
      },
    ],
    total: 149500,
    address: ["18 Road 9, Maadi", "Cairo, Egypt"],
  },
  {
    id: "LM-2047",
    customer: "Omar Khaled",
    email: "omar.k@example.com",
    placedAt: "2026-10-24T09:18:00",
    status: "Processing",
    paymentStatus: "Awaiting payment",
    paymentMethod: "Cash on delivery",
    items: [
      {
        name: "Ribbed Glass Carafe",
        variant: "Smoke grey · 1.2 L",
        quantity: 1,
        amount: 42000,
      },
    ],
    total: 47000,
    address: ["6 El-Montaza Street", "Alexandria, Egypt"],
  },
  {
    id: "LM-2046",
    customer: "Nour Samir",
    email: "nour.s@example.com",
    placedAt: "2026-10-23T16:30:00",
    status: "Confirmed",
    paymentStatus: "Paid",
    paymentMethod: "Mastercard ending in 1088",
    items: [
      {
        name: "Handwoven Table Runner",
        variant: "Oatmeal · 180 cm",
        quantity: 1,
        amount: 59000,
      },
      {
        name: "Linen Napkin Set",
        variant: "Natural flax · Set of 4",
        quantity: 1,
        amount: 28500,
      },
    ],
    total: 87500,
    address: ["12 Zamalek", "Cairo, Egypt"],
  },
  {
    id: "LM-2045",
    customer: "Youssef Mahmoud",
    email: "youssef.m@example.com",
    placedAt: "2026-10-23T11:05:00",
    status: "Shipped",
    paymentStatus: "Paid",
    paymentMethod: "Visa ending in 8210",
    items: [
      {
        name: "Oak Catchall Tray",
        variant: "Natural oak · Large",
        quantity: 2,
        amount: 37500,
      },
    ],
    total: 75000,
    address: ["21 El-Gomhoreya Street", "Mansoura, Egypt"],
  },
  {
    id: "LM-2044",
    customer: "Laila Hassan",
    email: "laila.h@example.com",
    placedAt: "2026-10-22T13:50:00",
    status: "Delivered",
    paymentStatus: "Collected",
    paymentMethod: "Cash on delivery",
    items: [
      {
        name: "Sculpted Ceramic Vase",
        variant: "Warm ivory · Small",
        quantity: 1,
        amount: 62000,
      },
    ],
    total: 67000,
    address: ["9 Sporting", "Alexandria, Egypt"],
  },
  {
    id: "LM-2043",
    customer: "Adam Fathy",
    email: "adam.f@example.com",
    placedAt: "2026-10-21T08:22:00",
    status: "Order Placed",
    paymentStatus: "Paid",
    paymentMethod: "Visa ending in 3306",
    items: [
      {
        name: "Linen Cushion Cover",
        variant: "Olive · 50 × 50 cm",
        quantity: 2,
        amount: 32500,
      },
    ],
    total: 65000,
    address: ["3 Degla Square, Maadi", "Cairo, Egypt"],
  },
];

const statusTone: Record<OrderStatus, string> = {
  "Order Placed": "border-slate-200 bg-slate-100 text-slate-700",
  Confirmed: "border-blue-200 bg-blue-50 text-blue-700",
  Processing: "border-amber-200 bg-amber-50 text-amber-800",
  Shipped: "border-violet-200 bg-violet-50 text-violet-700",
  "Out for Delivery": "border-orange-200 bg-orange-50 text-orange-800",
  Delivered: "border-emerald-200 bg-emerald-50 text-emerald-800",
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
              #{order.id}
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
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-muted-foreground">
                {order.paymentMethod} · {order.paymentStatus}
              </span>
              <span className="font-semibold tabular">
                {formatPrice(order.total)}
              </span>
            </div>
          </section>
          <p className="rounded-md bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
            Demo order — updates are held in this page only and are not saved to
            the backend.
          </p>
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
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("All orders");
  const [page, setPage] = useState(1);
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 400);
    return () => window.clearTimeout(timer);
  }, []);

  const visibleOrders = useMemo(() => {
    const search = query.trim().toLowerCase();
    return orders
      .filter((order) => filter === "All orders" || order.status === filter)
      .filter(
        (order) =>
          !search ||
          [order.id, order.customer, order.email].some((value) =>
            value.toLowerCase().includes(search),
          ),
      )
      .sort((a, b) =>
        sortNewestFirst
          ? b.placedAt.localeCompare(a.placedAt)
          : a.placedAt.localeCompare(b.placedAt),
      );
  }, [filter, orders, query, sortNewestFirst]);

  const pageCount = Math.max(1, Math.ceil(visibleOrders.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageOrders = visibleOrders.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const firstVisibleOrder = visibleOrders.length
    ? (currentPage - 1) * PAGE_SIZE + 1
    : 0;
  const lastVisibleOrder = Math.min(
    currentPage * PAGE_SIZE,
    visibleOrders.length,
  );

  const selectedOrder =
    orders.find((order) => order.id === selectedOrderId) ?? null;
  const toFulfill = orders.filter(
    (order) =>
      order.status !== "Delivered" && order.status !== "Out for Delivery",
  ).length;
  const inTransit = orders.filter(
    (order) =>
      order.status === "Shipped" || order.status === "Out for Delivery",
  ).length;
  const paidRevenue = orders
    .filter((order) => order.paymentStatus !== "Awaiting payment")
    .reduce((sum, order) => sum + order.total, 0);

  function updateStatus(orderId: string, status: OrderStatus) {
    const order = orders.find((current) => current.id === orderId);
    if (!order || order.status === status) return;

    setOrders((current) =>
      current.map((currentOrder) =>
        currentOrder.id === orderId
          ? { ...currentOrder, status }
          : currentOrder,
      ),
    );
    toast("Fulfillment status updated", `#${orderId} is now ${status}.`);
  }

  if (loading) return <OrdersPageSkeleton />;

  return (
    <div className="space-y-7">
      <PageHeader
        title="Orders"
        description="Review customer purchases, keep fulfillment moving, and update each delivery as it progresses."
        action={
          <Badge
            variant="outline"
            className="h-8 w-fit gap-2 rounded-md border-amber-200 bg-amber-50 px-3 text-[11px] font-medium text-amber-800"
          >
            <span className="size-1.5 rounded-full bg-amber-500" />
            Demo data · Not saved
          </Badge>
        }
      />

      <section
        aria-label="Order overview"
        className="grid grid-cols-2 gap-3 xl:grid-cols-4"
      >
        <SummaryCard
          label="Total orders"
          value={orders.length}
          detail="In this sample view"
          icon={ShoppingBag}
          tone="bg-blue-500/10 text-blue-700"
        />
        <SummaryCard
          label="To fulfill"
          value={toFulfill}
          detail="Need a fulfillment step"
          icon={PackageCheck}
          tone="bg-amber-500/10 text-amber-700"
        />
        <SummaryCard
          label="In transit"
          value={inTransit}
          detail="On the way to customers"
          icon={Truck}
          tone="bg-violet-500/10 text-violet-700"
        />
        <SummaryCard
          label="Paid revenue"
          value={formatPrice(paidRevenue)}
          detail="From listed sample orders"
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
                  setQuery(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-10 justify-start rounded-md sm:w-44"
              onClick={() => setSortNewestFirst((value) => !value)}
            >
              <ArrowDownUp className="size-4" />
              {sortNewestFirst ? "Newest first" : "Oldest first"}
            </Button>
          </div>

          <div className="flex flex-col justify-between gap-3 border-t border-border pt-4 sm:flex-row sm:items-center">
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {visibleOrders.length}
              </span>{" "}
              {visibleOrders.length === 1 ? "order" : "orders"}
            </p>
            <Select
              value={filter}
              onValueChange={(value) => {
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
            <Badge
              variant="secondary"
              className="rounded-md px-2.5 text-[10px] font-medium uppercase tracking-[0.12em]"
            >
              Frontend preview
            </Badge>
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

          {pageOrders.length ? (
            <ul className="divide-y divide-border/70">
              {pageOrders.map((order) => (
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
                        #{order.id}
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
                    <span className="text-sm font-medium tabular">
                      {formatPrice(order.total)}
                    </span>
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
                        updateStatus(order.id, value as OrderStatus)
                      }
                    >
                      <SelectTrigger
                        className="h-9 w-full rounded-md bg-background px-2.5 text-xs xl:min-w-40"
                        aria-label={`Update status for order ${order.id}`}
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
              <p className="mt-3 font-medium">No matching orders</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try another search term or fulfillment status.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 border-t bg-muted/15 px-4 py-3 text-xs text-muted-foreground sm:px-5">
            <span>
              Showing {firstVisibleOrder}–{lastVisibleOrder} of{" "}
              {visibleOrders.length} matching orders
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-3.5 text-emerald-700" />
              Status changes stay in this session
            </span>
          </div>
          {visibleOrders.length > PAGE_SIZE && (
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
                  disabled={currentPage === 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="size-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                  (pageNumber) => (
                    <Button
                      key={pageNumber}
                      type="button"
                      variant={pageNumber === currentPage ? "default" : "ghost"}
                      size="sm"
                      className="size-8 rounded-md p-0"
                      aria-label={`Page ${pageNumber}`}
                      aria-current={
                        pageNumber === currentPage ? "page" : undefined
                      }
                      onClick={() => setPage(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  ),
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 rounded-md px-2.5"
                  disabled={currentPage === pageCount}
                  onClick={() =>
                    setPage((value) => Math.min(pageCount, value + 1))
                  }
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
