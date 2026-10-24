import { useEffect, useState } from "react";
import {
  Calendar,
  Mail,
  Package,
  ShieldCheck,
  ShieldOff,
  ShoppingBag,
  User,
  Wallet,
} from "lucide-react";
import { apiRequest } from "@/features/auth/auth-client";
import { formatPrice } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

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

interface OrderSummary {
  id: string;
  amountTotal: number;
  currency: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: string;
  items: { name: string; quantity: number }[];
}

interface CustomerDetail {
  customer: Customer;
  orders: OrderSummary[];
}

type CustomerDetailState =
  | { customerId: string; status: "success"; detail: CustomerDetail }
  | { customerId: string; status: "error"; message: string };

// ── Palette ────────────────────────────────────────────────────────────

const palette = {
  green: { backgroundColor: "#dcfce7", color: "#15803d" },
  blue: { backgroundColor: "#dbeafe", color: "#1d4ed8" },
  violet: { backgroundColor: "#ede9fe", color: "#6d28d9" },
  amber: { backgroundColor: "#fef3c7", color: "#b45309" },
  red: { backgroundColor: "#fee2e2", color: "#b91c1c" },
};

const fulfillmentStyles: Record<string, typeof palette.green> = {
  pending: palette.amber,
  processing: palette.blue,
  shipped: palette.violet,
  delivered: palette.green,
  cancelled: palette.red,
};

const paymentStyles: Record<string, typeof palette.green> = {
  pending: palette.amber,
  paid: palette.green,
  awaiting_cod: palette.blue,
  failed: palette.red,
};

// ── Helpers ────────────────────────────────────────────────────────────

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
  { backgroundColor: "#dbeafe", color: "#1d4ed8" },
  { backgroundColor: "#dcfce7", color: "#15803d" },
  { backgroundColor: "#ede9fe", color: "#6d28d9" },
  { backgroundColor: "#fef3c7", color: "#b45309" },
  { backgroundColor: "#fee2e2", color: "#b91c1c" },
  { backgroundColor: "#fce7f3", color: "#be185d" },
  { backgroundColor: "#e0e7ff", color: "#4338ca" },
  { backgroundColor: "#ccfbf1", color: "#0f766e" },
];

function colorForId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++)
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  return initialsColors[Math.abs(hash) % initialsColors.length];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, " ");
}

// ── Component ──────────────────────────────────────────────────────────

export function CustomerDetailDialog({
  customer,
  onClose,
  onToggleStatus,
  togglingId,
}: {
  customer: Customer | null;
  onClose: () => void;
  onToggleStatus: (customer: Customer) => void;
  togglingId: string | null;
}) {
  const [detailState, setDetailState] = useState<CustomerDetailState | null>(
    null,
  );
  const customerId = customer?.id;

  useEffect(() => {
    if (!customerId) return;

    let cancelled = false;
    apiRequest<CustomerDetail>(`/admin/customers/${customerId}`)
      .then((detail) => {
        if (!cancelled) {
          setDetailState({
            customerId,
            status: "success",
            detail,
          });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setDetailState({
            customerId,
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Unable to load customer details.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  // Use detail data when available, fall back to the list-level customer
  const currentDetail =
    detailState?.customerId === customer?.id ? detailState : null;
  const detail =
    currentDetail?.status === "success" ? currentDetail.detail : null;
  const detailError =
    currentDetail?.status === "error" ? currentDetail.message : null;
  const loading = Boolean(customer && !currentDetail);
  const c = detail?.customer ?? customer;
  const orders = detail?.orders ?? [];
  const color = c ? colorForId(c.id) : initialsColors[0];

  const avgOrderValue =
    c && c.orderCount > 0 ? Math.round(c.totalSpent / c.orderCount) : 0;

  return (
    <Dialog open={!!customer} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg sm:max-w-lg !rounded-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-sans">Customer profile</DialogTitle>
        </DialogHeader>

        {!c ? null : (
          <div className="space-y-5">
            {/* ── Profile card ─────────────────────────────────────── */}
            <div className="flex items-start gap-4">
              <Avatar className="size-14">
                {c.avatarUrl ? (
                  <AvatarImage
                    src={c.avatarUrl}
                    alt={c.name || c.username}
                  />
                ) : null}
                <AvatarFallback
                  className="text-base font-semibold"
                  style={color}
                >
                  {initials(c)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-sans text-lg font-semibold">
                    {c.name || c.username}
                  </h3>
                  <Badge
                    className="border-0 font-semibold"
                    style={
                      c.status === "active" ? palette.green : palette.red
                    }
                  >
                    {c.status === "active" ? "Active" : "Disabled"}
                  </Badge>
                </div>
                <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                  <p className="flex items-center gap-1.5">
                    <User className="size-3.5" />@{c.username}
                  </p>
                  <p className="flex items-center gap-1.5 truncate">
                    <Mail className="size-3.5" />
                    {c.email}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Calendar className="size-3.5" />
                    Joined {formatDate(c.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* ── Order stats ──────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Orders",
                  value: c.orderCount,
                  icon: ShoppingBag,
                  tone: palette.blue,
                },
                {
                  label: "Total Spent",
                  value: formatPrice(c.totalSpent),
                  icon: Wallet,
                  tone: palette.green,
                },
                {
                  label: "Avg. Order",
                  value: formatPrice(avgOrderValue),
                  icon: Package,
                  tone: palette.violet,
                },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-border p-3 text-center"
                  >
                    <span
                      className="mx-auto mb-2 grid size-8 place-items-center rounded-lg"
                      style={stat.tone}
                    >
                      <Icon className="size-4" strokeWidth={1.8} />
                    </span>
                    <p className="text-lg font-semibold tabular leading-tight">
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* ── Recent orders ─────────────────────────────────────── */}
            <div>
              <h4 className="mb-3 text-sm font-semibold">Recent Orders</h4>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 rounded-lg" />
                  ))}
                </div>
              ) : detailError ? (
                <p className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                  {detailError}
                </p>
              ) : orders.length === 0 ? (
                <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                  No orders yet
                </div>
              ) : (
                <div className="max-h-56 space-y-2 overflow-y-auto scrollbar-none">
                  {orders.map((order) => {
                    const itemCount = order.items.reduce(
                      (sum, item) => sum + item.quantity,
                      0,
                    );
                    return (
                      <div
                        key={order.id}
                        className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-muted/50"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {formatPrice(order.amountTotal)}
                            <span className="ml-2 text-xs text-muted-foreground">
                              · {itemCount} item{itemCount !== 1 ? "s" : ""}
                            </span>
                          </p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            className="border-0 text-[10px] font-semibold"
                            style={
                              paymentStyles[order.paymentStatus] ?? palette.amber
                            }
                          >
                            {capitalize(order.paymentStatus)}
                          </Badge>
                          <Badge
                            className="border-0 text-[10px] font-semibold"
                            style={
                              fulfillmentStyles[order.fulfillmentStatus] ??
                              palette.amber
                            }
                          >
                            {capitalize(order.fulfillmentStatus)}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Actions ──────────────────────────────────────────── */}
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-sm"
                onClick={() => c && onToggleStatus(c)}
                disabled={togglingId === c.id}
              >
                {c.status === "active" ? (
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
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
