import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CircleHelp,
  Clock3,
  CreditCard,
  MapPin,
  Package,
  PackageCheck,
  Truck,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { formatPrice } from "@/services/api";
import {
  ORDER_STAGES,
  orderTrackingService,
  type OrderStage,
  type TrackingOrder,
} from "./order-tracking-service";
import type { Category, Product } from "@/types/product";
import { StorefrontLayout } from "@/components/StorefrontLayout";
import { Skeleton } from "@/components/ui/skeleton";

const stageIcons: Record<OrderStage, LucideIcon> = {
  placed: PackageCheck,
  confirmed: BadgeCheck,
  processing: Warehouse,
  shipped: Package,
  out_for_delivery: Truck,
  delivered: Check,
};

const stageBadgeClass: Record<OrderStage, string> = {
  placed: "bg-stone-100 text-stone-700",
  confirmed: "bg-sky-100 text-sky-800",
  processing: "bg-amber-100 text-amber-800",
  shipped: "bg-violet-100 text-violet-800",
  out_for_delivery: "bg-orange-100 text-orange-800",
  delivered: "bg-emerald-100 text-emerald-800",
};

function formatDate(value: string, includeTime = false) {
  return new Intl.DateTimeFormat("en-EG", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(includeTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(new Date(value));
}

function orderTotal(order: TrackingOrder) {
  return (
    order.items.reduce(
      (total, item) => total + item.unitAmount * item.quantity,
      0,
    ) + order.shippingAmount
  );
}

function StageTimeline({ order }: { order: TrackingOrder }) {
  const currentIndex = ORDER_STAGES.findIndex(
    (stage) => stage.key === order.currentStage,
  );

  return (
    <ol aria-label="Order status timeline" className="mt-8">
      {ORDER_STAGES.map((stage, index) => {
        const complete = index < currentIndex;
        const current = index === currentIndex;
        const timestamp = order.timeline[stage.key];
        const Icon = stageIcons[stage.key];

        return (
          <li
            key={stage.key}
            className="relative flex gap-4 pb-7 last:pb-0 sm:gap-5"
          >
            {index < ORDER_STAGES.length - 1 && (
              <span
                aria-hidden="true"
                className={`absolute top-9 bottom-0 left-4 w-px ${
                  complete ? "bg-clay/60" : "bg-border"
                }`}
              />
            )}
            <span
              aria-hidden="true"
              className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border ${
                complete
                  ? "border-clay bg-clay text-background"
                  : current
                    ? "border-clay bg-background text-clay ring-4 ring-clay/10"
                    : "border-border bg-background text-muted-foreground"
              }`}
            >
              <Icon className="size-4" strokeWidth={1.6} />
            </span>
            <div className="min-w-0 flex-1 pt-0.5 sm:flex sm:items-start sm:justify-between sm:gap-4">
              <div>
                <p
                  className={`text-sm ${
                    current || complete
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {stage.label}
                  {current && (
                    <span
                      className={`ml-2 rounded-full px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${stageBadgeClass[stage.key]}`}
                    >
                      Current
                    </span>
                  )}
                </p>
                {current && (
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {stage.key === "delivered"
                      ? "Your order has arrived. We hope you love it."
                      : "Your order is moving along. We’ll keep you updated."}
                  </p>
                )}
              </div>
              {timestamp && (
                <time
                  dateTime={timestamp}
                  className="mt-1 block shrink-0 text-xs text-muted-foreground sm:mt-0 sm:text-right"
                >
                  {formatDate(timestamp, true)}
                </time>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function OrderItems({ order }: { order: TrackingOrder }) {
  return (
    <ul className="mt-5 divide-y divide-border/80">
      {order.items.map((item) => (
        <li
          key={`${item.name}-${item.variant}`}
          className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-clay">
            <Package className="size-5" strokeWidth={1.4} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{item.name}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {item.variant} · Qty {item.quantity}
            </p>
          </div>
          <p className="shrink-0 text-sm tabular">
            {formatPrice(item.unitAmount * item.quantity)}
          </p>
        </li>
      ))}
    </ul>
  );
}

function OrderDetails({ order }: { order: TrackingOrder }) {
  const subtotal = order.items.reduce(
    (total, item) => total + item.unitAmount * item.quantity,
    0,
  );

  return (
    <aside className="space-y-5">
      <section className="rounded-md border border-border bg-card p-5 sm:p-6">
        <p className="eyebrow text-muted-foreground">Delivery address</p>
        <div className="mt-4 flex gap-3">
          <MapPin className="mt-0.5 size-4 shrink-0 text-clay" />
          <div className="text-sm leading-6">
            <p className="font-medium">{order.shipping.name}</p>
            {order.shipping.address.map((line) => (
              <p key={line} className="text-muted-foreground">
                {line}
              </p>
            ))}
            <p className="mt-1 text-muted-foreground">{order.shipping.phone}</p>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-border bg-card p-5 sm:p-6">
        <p className="eyebrow text-muted-foreground">Payment</p>
        <div className="mt-4 flex items-start gap-3">
          <CreditCard className="mt-0.5 size-4 shrink-0 text-clay" />
          <div>
            <p className="text-sm font-medium">{order.paymentStatus}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {order.paymentMethod}
            </p>
          </div>
        </div>
        <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between gap-3 text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between gap-3 text-muted-foreground">
            <span>Delivery</span>
            <span className="tabular">
              {order.shippingAmount
                ? formatPrice(order.shippingAmount)
                : "Complimentary"}
            </span>
          </div>
          <div className="flex justify-between gap-3 border-t border-border pt-3 font-medium">
            <span>Total</span>
            <span className="tabular">{formatPrice(orderTotal(order))}</span>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-border bg-secondary/60 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <CircleHelp className="mt-0.5 size-4 shrink-0 text-clay" />
          <div>
            <p className="text-sm font-medium">Need a hand?</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Our care team is here if you have a question about your delivery.
            </p>
            <a
              href="/faq"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium underline decoration-clay/50 underline-offset-4 transition-colors hover:text-clay"
            >
              Visit help & FAQs <ArrowRight className="size-3.5" />
            </a>
          </div>
        </div>
      </section>
    </aside>
  );
}

export function OrderTrackingSkeleton() {
  return (
    <main
      aria-label="Loading order tracking"
      className="mx-auto min-h-[65vh] max-w-6xl px-5 pb-16 pt-8 sm:px-8 sm:pt-12"
    >
      <div className="animate-pulse">
        <Skeleton className="h-3 w-24" />
        <div className="mt-8 flex flex-col justify-between gap-5 border-b border-border pb-8 sm:flex-row sm:items-end">
          <div className="space-y-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-11 w-[28rem] max-w-[85vw]" />
            <Skeleton className="h-4 w-52" />
          </div>
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-8">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-md border border-border bg-card">
              <div className="flex flex-col justify-between gap-5 bg-secondary/55 p-6 sm:flex-row sm:items-center sm:px-8 sm:py-7">
                <div className="flex items-center gap-4">
                  <Skeleton className="size-12 shrink-0 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-8 w-40" />
                  </div>
                </div>
                <Skeleton className="h-16 w-48" />
              </div>
              <div className="p-6 sm:p-8">
                <Skeleton className="h-7 w-52" />
                <Skeleton className="mt-2 h-4 w-80 max-w-full" />
                <div className="mt-8 space-y-7">
                  {[0, 1, 2, 3, 4, 5].map((item) => (
                    <div key={item} className="flex items-center gap-4">
                      <Skeleton className="size-8 shrink-0 rounded-full" />
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="ml-auto h-3 w-28" />
                    </div>
                  ))}
                </div>
              </div>
            </section>
            <section className="rounded-md border border-border bg-card p-6 sm:p-8">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-7 w-52" />
              <div className="mt-6 space-y-5">
                {[0, 1].map((item) => (
                  <div key={item} className="flex items-center gap-4">
                    <Skeleton className="size-12 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-56 max-w-full" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </section>
          </div>
          <aside className="space-y-5">
            {[0, 1, 2].map((item) => (
              <section
                key={item}
                className="rounded-md border border-border bg-card p-5 sm:p-6"
              >
                <Skeleton className="h-3 w-28" />
                <Skeleton className="mt-5 h-4 w-36" />
                <Skeleton className="mt-2 h-3 w-48 max-w-full" />
                {item === 1 && (
                  <>
                    <Skeleton className="mt-7 h-3 w-full" />
                    <Skeleton className="mt-3 h-3 w-full" />
                    <Skeleton className="mt-5 h-4 w-full" />
                  </>
                )}
              </section>
            ))}
          </aside>
        </div>
      </div>
    </main>
  );
}

function OrderTrackingContent({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<TrackingOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void orderTrackingService
      .getOrder(orderId)
      .then((result) => {
        if (!cancelled) setOrder(result ?? null);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "We could not load this order.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (loading) {
    return (
      <main
        aria-label="Loading order tracking"
        className="mx-auto min-h-[65vh] max-w-6xl px-5 pb-16 pt-8 sm:px-8 sm:pt-12"
      >
        <div className="animate-pulse">
          <Skeleton className="h-3 w-24" />
          <div className="mt-8 flex flex-col justify-between gap-5 border-b border-border pb-8 sm:flex-row sm:items-end">
            <div className="space-y-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-11 w-[28rem] max-w-[85vw]" />
              <Skeleton className="h-4 w-52" />
            </div>
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-8">
            <div className="space-y-6">
              <section className="overflow-hidden rounded-md border border-border bg-card">
                <div className="flex flex-col justify-between gap-5 bg-secondary/55 p-6 sm:flex-row sm:items-center sm:px-8 sm:py-7">
                  <div className="flex items-center gap-4">
                    <Skeleton className="size-12 shrink-0 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-8 w-40" />
                    </div>
                  </div>
                  <Skeleton className="h-16 w-48" />
                </div>
                <div className="p-6 sm:p-8">
                  <Skeleton className="h-7 w-52" />
                  <Skeleton className="mt-2 h-4 w-80 max-w-full" />
                  <div className="mt-8 space-y-7">
                    {[0, 1, 2, 3, 4, 5].map((item) => (
                      <div key={item} className="flex items-center gap-4">
                        <Skeleton className="size-8 shrink-0 rounded-full" />
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="ml-auto h-3 w-28" />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
              <section className="rounded-md border border-border bg-card p-6 sm:p-8">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-3 h-7 w-52" />
                <div className="mt-6 space-y-5">
                  {[0, 1].map((item) => (
                    <div key={item} className="flex items-center gap-4">
                      <Skeleton className="size-12 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-56 max-w-full" />
                      </div>
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              </section>
            </div>
            <aside className="space-y-5">
              {[0, 1, 2].map((item) => (
                <section
                  key={item}
                  className="rounded-md border border-border bg-card p-5 sm:p-6"
                >
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="mt-5 h-4 w-36" />
                  <Skeleton className="mt-2 h-3 w-48 max-w-full" />
                  {item === 1 && (
                    <>
                      <Skeleton className="mt-7 h-3 w-full" />
                      <Skeleton className="mt-3 h-3 w-full" />
                      <Skeleton className="mt-5 h-4 w-full" />
                    </>
                  )}
                </section>
              ))}
            </aside>
          </div>
        </div>
      </main>
    );
  }

  if (!order || error) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center bg-background px-6 text-center">
        <Package className="size-8 text-clay" strokeWidth={1.3} />
        <p className="eyebrow mt-5 text-clay">Order tracking</p>
        <h1 className="mt-3 font-serif text-4xl">
          {error ? "Tracking is unavailable" : "We couldn’t find that order"}
        </h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          {error ??
            "Check the order link or return to your order history to choose another order."}
        </p>
        <a
          href="/settings"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm text-background transition-colors hover:bg-clay"
        >
          <ArrowLeft className="size-4" /> Back to order history
        </a>
      </main>
    );
  }

  const currentStage = ORDER_STAGES.find(
    (stage) => stage.key === order.currentStage,
  );
  const isDelivered = order.currentStage === "delivered";

  return (
    <main className="min-h-screen bg-background px-5 pb-16 pt-8 sm:px-8 sm:pt-12">
      <div className="mx-auto max-w-6xl">
        <a
          href="/settings"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Your orders
        </a>

        <header className="mt-8 flex flex-col justify-between gap-6 border-b border-border pb-8 sm:mt-10 sm:flex-row sm:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="eyebrow text-clay">Order tracking</p>
              <span className="rounded-full border border-clay/25 bg-clay/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-clay">
                Sample data
              </span>
            </div>
            <h1 className="mt-3 max-w-2xl font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
              {isDelivered ? "Your order has arrived." : "A little closer to home."}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Order <span className="font-medium text-foreground">#{order.orderNumber}</span>
              <span className="mx-2 text-border">·</span>
              Placed {formatDate(order.placedAt)}
            </p>
          </div>
          <a
            href="/settings"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 self-start rounded-full border border-border px-4 text-xs transition-colors hover:border-foreground/30 sm:self-auto"
          >
            All orders <ArrowRight className="size-3.5" />
          </a>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-8">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-md border border-border bg-card">
              <div className="flex flex-col justify-between gap-5 bg-secondary/55 p-6 sm:flex-row sm:items-center sm:px-8 sm:py-7">
                <div className="flex items-start gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-clay text-background">
                    {isDelivered ? (
                      <Check className="size-5" />
                    ) : (
                      <Truck className="size-5" strokeWidth={1.5} />
                    )}
                  </span>
                  <div>
                    <p className="eyebrow text-clay">
                      {isDelivered ? "Delivery complete" : "Current status"}
                    </p>
                    <h2 className="mt-2 font-serif text-3xl">
                      {currentStage?.label}
                    </h2>
                  </div>
                </div>
                <div className="rounded-md border border-border/80 bg-card px-5 py-3 sm:min-w-48">
                  <p className="eyebrow text-muted-foreground">
                    {isDelivered ? "Delivered on" : "Estimated delivery"}
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    {formatDate(
                      isDelivered
                        ? (order.timeline.delivered ?? order.estimatedDelivery)
                        : order.estimatedDelivery,
                    )}
                  </p>
                </div>
              </div>
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-serif text-2xl">The journey so far</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      We’ll keep each step updated as your order makes its way to you.
                    </p>
                  </div>
                  <Clock3
                    className="hidden size-5 shrink-0 text-clay sm:block"
                    strokeWidth={1.4}
                  />
                </div>
                <StageTimeline order={order} />
              </div>
            </section>

            <section className="rounded-md border border-border bg-card p-6 sm:p-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="eyebrow text-muted-foreground">In this order</p>
                  <h2 className="mt-2 font-serif text-2xl">Thoughtfully chosen</h2>
                </div>
                <span className="text-xs text-muted-foreground">
                  {order.items.reduce((count, item) => count + item.quantity, 0)}{" "}
                  pieces
                </span>
              </div>
              <OrderItems order={order} />
            </section>
          </div>

          <OrderDetails order={order} />
        </div>

        <p className="mt-8 text-center text-[10px] uppercase tracking-[0.17em] text-muted-foreground/80">
          Order dates and tracking details shown here are sample data
        </p>
      </div>
    </main>
  );
}

export function OrderTrackingPage({
  orderId,
  products,
  categories,
}: {
  orderId: string;
  products: Product[];
  categories: Category[];
}) {
  return (
    <StorefrontLayout products={products} categories={categories}>
      <OrderTrackingContent orderId={orderId} />
    </StorefrontLayout>
  );
}

export function OrderHistorySection() {
  const [orders, setOrders] = useState<TrackingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void orderTrackingService
      .listOrders()
      .then((result) => {
        if (!cancelled) setOrders(result);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "We could not load your orders.",
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

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-clay">Your purchases</p>
          <h2 className="mt-2 font-serif text-3xl">Order history</h2>
        </div>
        <span className="rounded-full border border-clay/25 bg-clay/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-clay">
          Sample data
        </span>
      </div>

      {loading ? (
        <div className="mt-5 space-y-3" aria-label="Loading orders">
          {[0, 1].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-md border border-border bg-card"
            />
          ))}
        </div>
      ) : error ? (
        <p
          role="alert"
          className="mt-5 rounded-md border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive"
        >
          {error}
        </p>
      ) : orders.length ? (
        <ul className="mt-5 space-y-3">
          {orders.map((order) => {
            const status = ORDER_STAGES.find(
              (stage) => stage.key === order.currentStage,
            );
            const itemCount = order.items.reduce(
              (count, item) => count + item.quantity,
              0,
            );
            const delivered = order.currentStage === "delivered";

            return (
              <li key={order.id}>
                <a
                  href={`/orders/${encodeURIComponent(order.id)}`}
                  className="group block rounded-md border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-clay/40 hover:shadow-[0_16px_40px_-30px_rgba(26,24,21,0.4)] sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 items-start gap-4">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-clay">
                        {delivered ? (
                          <Check className="size-5" />
                        ) : (
                          <Truck className="size-5" strokeWidth={1.5} />
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <p className="text-sm font-medium">
                            Order #{order.orderNumber}
                          </p>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${stageBadgeClass[order.currentStage]}`}
                          >
                            {status?.label}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          Placed {formatDate(order.placedAt)} · {itemCount}{" "}
                          {itemCount === 1 ? "piece" : "pieces"}
                        </p>
                        <p className="mt-2 truncate text-xs text-muted-foreground">
                          {order.items.map((item) => item.name).join(" · ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t border-border pt-4 sm:justify-end sm:border-0 sm:pt-0">
                      <div className="sm:text-right">
                        <p className="text-sm font-medium tabular">
                          {formatPrice(orderTotal(order))}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {delivered
                            ? `Delivered ${formatDate(order.timeline.delivered ?? order.estimatedDelivery)}`
                            : `Arrives ${formatDate(order.estimatedDelivery)}`}
                        </p>
                      </div>
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border transition-all group-hover:border-clay group-hover:bg-clay group-hover:text-background">
                        <ArrowRight className="size-4" />
                      </span>
                    </div>
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-5 rounded-md border border-dashed border-border bg-card/50 px-6 py-10 text-center">
          <Package className="mx-auto size-6 text-clay" strokeWidth={1.4} />
          <p className="mt-3 font-serif text-2xl">No orders just yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Your next considered find will appear here.
          </p>
          <a
            href="/shop"
            className="mt-5 inline-flex items-center gap-2 text-sm underline decoration-clay/50 underline-offset-4 hover:text-clay"
          >
            Explore the collection <ArrowRight className="size-3.5" />
          </a>
        </div>
      )}
    </section>
  );
}
