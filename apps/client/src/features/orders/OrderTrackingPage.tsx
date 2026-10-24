import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CircleHelp,
  CircleX,
  Clock3,
  ChevronDown,
  CreditCard,
  Download,
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
import { SafeImage } from "@/components/motion/SafeImage";
import { Button } from "@/components/ui/button";

const stageIcons: Record<Exclude<OrderStage, "cancelled">, LucideIcon> = {
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
  cancelled: "bg-rose-100 text-rose-800",
};

function formatDate(value: string, includeTime = false) {
  return new Intl.DateTimeFormat("en-EG", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(includeTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(new Date(value));
}

function normalizeLegacyOrderAmounts(
  order: TrackingOrder,
  products: Product[],
): TrackingOrder {
  const matchesPreviouslyScaledPrices = order.items.every((item) => {
    const product = products.find(
      (candidate) => candidate.id === item.productId,
    );
    const variant = product?.variants?.find(
      (candidate) => candidate.id === item.variantId,
    );
    return variant && item.unitAmount === variant.price * 100;
  });
  const itemTotal = order.items.reduce(
    (total, item) => total + item.unitAmount * item.quantity,
    0,
  );

  // Older checkout records multiplied catalog minor-unit prices by 100 again.
  if (!matchesPreviouslyScaledPrices || order.amountTotal !== itemTotal)
    return order;

  return {
    ...order,
    amountTotal: order.amountTotal / 100,
    items: order.items.map((item) => ({
      ...item,
      unitAmount: item.unitAmount / 100,
    })),
  };
}

function StageTimeline({ order }: { order: TrackingOrder }) {
  const currentIndex = ORDER_STAGES.findIndex(
    (stage) => stage.key === order.currentStage,
  );
  const cancelled = order.currentStage === "cancelled";

  return (
    <>
      {cancelled && (
        <div
          role="status"
          className="mt-6 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"
        >
          <p className="font-medium">This order was cancelled.</p>
          {order.timeline.cancelled && (
            <time
              dateTime={order.timeline.cancelled}
              className="mt-1 block text-xs text-rose-800"
            >
              Cancelled {formatDate(order.timeline.cancelled, true)}
            </time>
          )}
        </div>
      )}
      <ol aria-label="Order status timeline" className="mt-8">
        {ORDER_STAGES.map((stage, index) => {
          const timestamp = order.timeline[stage.key];
          const current = index === currentIndex;
          const complete =
            index < currentIndex || (cancelled && Boolean(timestamp));
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
    </>
  );
}

function OrderItems({
  order,
  products,
}: {
  order: TrackingOrder;
  products: Product[];
}) {
  return (
    <ul className="mt-5 divide-y divide-border/80">
      {order.items.map((item) => {
        const product = products.find(
          (candidate) => candidate.id === item.productId,
        );
        const image = product?.images[0];

        return (
          <li
            key={`${item.name}-${item.variant}`}
            className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
          >
            <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-sm
             bg-secondary text-clay">
              {image ? (
                <SafeImage
                  src={image}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Package className="size-5" strokeWidth={1.4} />
              )}
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
        );
      })}
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
            <span className="tabular">{formatPrice(order.amountTotal)}</span>
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

function OrderInvoice({ order }: { order: TrackingOrder }) {
  const subtotal = order.items.reduce(
    (total, item) => total + item.unitAmount * item.quantity,
    0,
  );

  return createPortal(
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          body > * { display: none !important; }
          body > #order-invoice { display: block !important; }
          #order-invoice {
            position: static !important;
            box-sizing: border-box;
            color: #171512;
            background: #fff;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          #order-invoice tr,
          #order-invoice section,
          #order-invoice header,
          #order-invoice > div {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
      <article
        id="order-invoice"
        className="hidden print:block"
        aria-label={`Invoice for order ${order.orderNumber}`}
      >
        <header className="flex items-start justify-between border-b border-stone-300 pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em]">Lumina</p>
            <h1 className="mt-3 font-serif text-3xl">Order invoice</h1>
          </div>
          <div className="text-right text-sm">
            <p className="font-medium">#{order.orderNumber}</p>
            <p className="mt-1">{formatDate(order.placedAt)}</p>
          </div>
        </header>
        <div className="grid grid-cols-2 gap-8 py-6 text-sm">
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide">
              Billed to
            </h2>
            <p>{order.shipping.name}</p>
            {order.shipping.address.map((line) => (
              <p key={line}>{line}</p>
            ))}
            {order.shipping.phone && <p>{order.shipping.phone}</p>}
          </section>
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide">
              Payment
            </h2>
            <p>{order.paymentMethod}</p>
            <p className="mt-1">{order.paymentStatus}</p>
          </section>
        </div>
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-y border-stone-300">
              <th className="py-3 font-medium">Item</th>
              <th className="py-3 text-center font-medium">Qty</th>
              <th className="py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr
                key={`${item.productId}-${item.variantId}`}
                className="border-b border-stone-200"
              >
                <td className="py-3">
                  {item.name}
                  {item.variant && (
                    <span className="block text-xs text-stone-600">
                      {item.variant}
                    </span>
                  )}
                </td>
                <td className="py-3 text-center">{item.quantity}</td>
                <td className="py-3 text-right">
                  {formatPrice(item.unitAmount * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="ml-auto mt-6 max-w-xs space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Delivery</span>
            <span>
              {order.shippingAmount
                ? formatPrice(order.shippingAmount)
                : "Complimentary"}
            </span>
          </div>
          <div className="flex justify-between gap-4 border-t border-stone-300 pt-3 font-semibold">
            <span>Total</span>
            <span>{formatPrice(order.amountTotal)}</span>
          </div>
        </div>
      </article>
    </>,
    document.body,
  );
}

function OrderTrackingContent({
  orderId,
  products,
}: {
  orderId: string;
  products: Product[];
}) {
  const [order, setOrder] = useState<TrackingOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void orderTrackingService
      .getOrder(orderId)
      .then((result) => {
        if (!cancelled)
          setOrder(result ? normalizeLegacyOrderAmounts(result, products) : null);
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
  }, [orderId, products]);

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
  const isCancelled = order.currentStage === "cancelled";

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
            </div>
            <h1 className="mt-3 max-w-2xl font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
              {isCancelled
                ? "This order was cancelled."
                : isDelivered
                  ? "Your order has arrived."
                  : "A little closer to home."}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Order <span className="font-medium text-foreground">#{order.orderNumber}</span>
              <span className="mx-2 text-border">·</span>
              Placed {formatDate(order.placedAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => window.print()}
              title="Choose Save as PDF in the print dialog"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border px-4 text-xs transition-colors hover:border-foreground/30"
            >
              <Download className="size-3.5" />
              Save invoice as PDF
            </button>
            <a
              href="/settings"
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-border px-4 text-xs transition-colors hover:border-foreground/30"
            >
              All orders <ArrowRight className="size-3.5" />
            </a>
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-8">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-md border border-border bg-card">
              <div className="flex flex-col justify-between gap-5 bg-secondary/55 p-6 sm:flex-row sm:items-center sm:px-8 sm:py-7">
                <div className="flex items-start gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-clay text-background">
                    {isCancelled ? (
                      <CircleX className="size-5" />
                    ) : isDelivered ? (
                      <Check className="size-5" />
                    ) : (
                      <Truck className="size-5" strokeWidth={1.5} />
                    )}
                  </span>
                  <div>
                    <p className="eyebrow text-clay">
                      {isCancelled
                        ? "Order status"
                        : isDelivered
                          ? "Delivery complete"
                          : "Current status"}
                    </p>
                    <h2 className="mt-2 font-serif text-3xl">
                      {currentStage?.label ?? "Cancelled"}
                    </h2>
                  </div>
                </div>
                <div className="rounded-md border border-border/80 bg-card px-5 py-3 sm:min-w-48">
                  <p className="eyebrow text-muted-foreground">
                    {isCancelled
                      ? "Cancelled on"
                      : isDelivered
                        ? "Delivered on"
                        : "Estimated delivery"}
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    {formatDate(
                      isCancelled
                        ? (order.timeline.cancelled ?? order.placedAt)
                        : isDelivered
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
              <OrderItems order={order} products={products} />
            </section>
          </div>

          <OrderDetails order={order} />
        </div>
        <OrderInvoice order={order} />
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
      <OrderTrackingContent orderId={orderId} products={products} />
    </StorefrontLayout>
  );
}

export function OrderHistorySection() {
  const [orders, setOrders] = useState<TrackingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllOrders, setShowAllOrders] = useState(false);

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
        <>
          <ul className="mt-5 space-y-3">
          {(showAllOrders ? orders : orders.slice(0, 3)).map((order) => {
            const status = ORDER_STAGES.find(
              (stage) => stage.key === order.currentStage,
            );
            const cancelled = order.currentStage === "cancelled";
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
                        {cancelled ? (
                          <CircleX className="size-5" />
                        ) : delivered ? (
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
                            {status?.label ?? "Cancelled"}
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
                          {formatPrice(order.amountTotal)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {cancelled
                            ? `Cancelled ${formatDate(order.timeline.cancelled ?? order.placedAt)}`
                            : delivered
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
          {orders.length > 3 && (
            <Button
              type="button"
              size="sm"
              aria-expanded={showAllOrders}
              onClick={() => setShowAllOrders((current) => !current)}
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-full border border-border px-4"
            >
              {showAllOrders ? "Show recent orders" : "Show all orders"}
              <ChevronDown
                className={`size-4 transition-transform ${
                  showAllOrders ? "rotate-180" : ""
                }`}
              />
            </Button>
          )}
        </>
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
