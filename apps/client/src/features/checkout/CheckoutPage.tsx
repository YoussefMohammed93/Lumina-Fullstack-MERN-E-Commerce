import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  CheckCircle2,
  CircleAlert,
  CreditCard,
  LoaderCircle,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { z } from "zod";
import type { Product } from "@/types/product";
import { formatPrice } from "@/services/api";
import { apiRequest, authenticatedRequest } from "@/features/auth/auth-client";
import { useAuth } from "@/features/auth/useAuth";
import { useCart } from "@/features/cart/useCart";
import { ArrowButton } from "@/components/ArrowButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const governorates = [
  "Alexandria",
  "Aswan",
  "Asyut",
  "Beheira",
  "Beni Suef",
  "Cairo",
  "Dakahlia",
  "Damietta",
  "Faiyum",
  "Gharbia",
  "Giza",
  "Ismailia",
  "Kafr El Sheikh",
  "Luxor",
  "Matruh",
  "Minya",
  "Monufia",
  "New Valley",
  "North Sinai",
  "Port Said",
  "Qalyubia",
  "Qena",
  "Red Sea",
  "Sharqia",
  "Sohag",
  "South Sinai",
  "Suez",
];
type PaymentMethod = "stripe" | "cash_on_delivery";
type CheckoutItem = {
  product: Product;
  quantity: number;
  variant: NonNullable<Product["variants"]>[number];
};
type AddressForm = {
  name: string;
  phone: string;
  governorate: string;
  line1: string;
  line2: string;
  city: string;
  postalCode: string;
};

const deliverySchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(80),
  phone: z.string().trim().min(10, "Enter a valid phone number.").max(20),
  governorate: z
    .string()
    .refine(
      (value) => governorates.includes(value),
      "Choose your governorate.",
    ),
  line1: z.string().trim().min(5, "Enter your delivery address.").max(160),
  line2: z.string().trim().max(160),
  city: z.string().trim().max(80),
  postalCode: z.string().trim().max(20),
});

export function CheckoutPage({ products }: { products: Product[] }) {
  const { lines, subtotal, clearCart } = useCart();
  const { user, csrfToken, openAuth } = useAuth();
  const [method, setMethod] = useState<PaymentMethod>("stripe");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof AddressForm, string>>
  >({});
  const [placed, setPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: user?.name ?? "",
    phone: "",
    governorate: "",
    line1: "",
    line2: "",
    city: "",
    postalCode: "",
  });
  const items = useMemo<CheckoutItem[]>(
    () =>
      lines.flatMap((line) => {
        const product = products.find((item) => item.id === line.productId);
        const variant = product?.variants?.find(
          (item) => item.id === line.variantId,
        );
        return product && variant
          ? [{ product, variant, quantity: line.quantity }]
          : [];
      }),
    [lines, products],
  );
  const codAvailable = items.every(
    ({ product }) => product.cashOnDeliveryAvailable !== false,
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!user || !csrfToken) return openAuth();
    if (!items.length) return setError("Your bag is empty.");
    if (method === "cash_on_delivery") {
      const validation = deliverySchema.safeParse(form);
      if (!validation.success) {
        const errors = z.flattenError(validation.error).fieldErrors;
        setFieldErrors({
          name: errors.name?.[0],
          phone: errors.phone?.[0],
          governorate: errors.governorate?.[0],
          line1: errors.line1?.[0],
          line2: errors.line2?.[0],
          city: errors.city?.[0],
          postalCode: errors.postalCode?.[0],
        });
        return;
      }
      setFieldErrors({});
    }
    setSubmitting(true);
    try {
      if (method === "stripe") {
        const { url } = await authenticatedRequest<{ url: string }>(
          "/checkout/stripe",
          csrfToken,
          { method: "POST" },
        );
        window.location.assign(url);
        return;
      }
      const result = await authenticatedRequest<{ orderId: string }>(
        "/checkout/cash-on-delivery",
        csrfToken,
        { method: "POST", body: JSON.stringify(form) },
      );
      await clearCart();
      setPlacedOrderId(result.orderId);
      setPlaced(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to start checkout.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (placed)
    return (
      <OrderConfirmation
        title="Order received"
        message="Your order is confirmed. Please have the exact amount ready when it arrives."
        orderId={placedOrderId}
      />
    );
  return (
    <main className="min-h-screen bg-background px-5 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <a
          href="/"
          className="eyebrow text-muted-foreground hover:text-foreground"
        >
          ← Continue shopping
        </a>
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <form onSubmit={submit} className="max-w-2xl space-y-7">
            <div>
              <p className="eyebrow text-clay">Secure checkout</p>
              <h1 className="mt-3 font-serif text-5xl">Complete your order</h1>
            </div>
            {!user && (
              <button
                type="button"
                onClick={openAuth}
                className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm"
              >
                Sign in to securely checkout.
              </button>
            )}
            {!items.length ? (
              <p className="rounded-2xl border border-border p-5 text-sm text-muted-foreground">
                Your bag is empty.
              </p>
            ) : (
              <>
                <section className="rounded-xl border border-border bg-card p-5">
                  <h2 className="font-serif text-2xl">Payment method</h2>
                  <div className="mt-4 space-y-3">
                    <PaymentOption
                      checked={method === "stripe"}
                      onChange={() => setMethod("stripe")}
                      title="Card payment"
                      description="Pay securely through Stripe Checkout."
                      icon={<CreditCard className="size-5" />}
                    />
                    <PaymentOption
                      checked={method === "cash_on_delivery"}
                      disabled={!codAvailable}
                      onChange={() => setMethod("cash_on_delivery")}
                      title="Cash on delivery"
                      description={
                        codAvailable
                          ? "Pay when your order arrives."
                          : "Unavailable because one or more products require online payment."
                      }
                      icon={<Truck className="size-5" />}
                    />
                  </div>
                </section>
                {method === "cash_on_delivery" && (
                  <DeliveryForm
                    form={form}
                    setForm={setForm}
                    errors={fieldErrors}
                  />
                )}
                {error && (
                  <p
                    role="alert"
                    className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
                  >
                    {error}
                  </p>
                )}
                <ArrowButton
                  type="submit"
                  disabled={submitting || !user || !items.length}
                  className="w-full justify-between"
                >
                  {submitting
                    ? "Preparing secure checkout…"
                    : method === "stripe"
                      ? "Continue to Stripe"
                      : "Place cash-on-delivery order"}
                </ArrowButton>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="size-4" /> Card details are collected
                  by Stripe and never touch our server.
                </p>
              </>
            )}
          </form>
          <OrderSummary items={items} subtotal={subtotal} />
        </div>
      </div>
    </main>
  );
}

function PaymentOption({
  checked,
  disabled,
  onChange,
  title,
  description,
  icon,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-md border p-4 ${checked ? "border-clay bg-clay/5" : "border-border"} ${disabled ? "cursor-not-allowed opacity-45" : ""}`}
    >
      <input
        type="radio"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="shrink-0 accent-clay"
      />
      <span className="flex size-8 shrink-0 items-center justify-center text-clay">
        {icon}
      </span>
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}
function Field({
  label,
  value,
  onChange,
  type = "text",
  required = true,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="text-sm">
      {label}
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3 aria-invalid:border-destructive"
      />
      {error && (
        <span className="mt-1 block text-xs text-destructive">{error}</span>
      )}
    </label>
  );
}
function DeliveryForm({
  form,
  setForm,
  errors,
}: {
  form: AddressForm;
  setForm: (value: AddressForm) => void;
  errors: Partial<Record<keyof AddressForm, string>>;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-serif text-2xl">Delivery details</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field
          label="Full name"
          value={form.name}
          onChange={(name) => setForm({ ...form, name })}
          error={errors.name}
        />
        <Field
          label="Phone number"
          type="tel"
          value={form.phone}
          onChange={(phone) => setForm({ ...form, phone })}
          error={errors.phone}
        />
        <label className="text-sm sm:col-span-2">
          Governorate
          <Select
            value={form.governorate}
            onValueChange={(governorate) => setForm({ ...form, governorate })}
          >
            <SelectTrigger
              aria-invalid={Boolean(errors.governorate)}
              className="mt-1.5 aria-invalid:border-destructive"
            >
              <SelectValue placeholder="Choose your governorate" />
            </SelectTrigger>
            <SelectContent>
              {governorates.map((governorate) => (
                <SelectItem key={governorate} value={governorate}>
                  {governorate}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.governorate && (
            <span className="mt-1 block text-xs text-destructive">
              {errors.governorate}
            </span>
          )}
        </label>
        <div className="sm:col-span-2">
          <Field
            label="Address"
            value={form.line1}
            onChange={(line1) => setForm({ ...form, line1 })}
            error={errors.line1}
          />
        </div>
        <div className="sm:col-span-2">
          <Field
            label="Address details (optional)"
            required={false}
            value={form.line2}
            onChange={(line2) => setForm({ ...form, line2 })}
            error={errors.line2}
          />
        </div>
        <Field
          label="City (optional)"
          required={false}
          value={form.city}
          onChange={(city) => setForm({ ...form, city })}
          error={errors.city}
        />
        <Field
          label="Postal code (optional)"
          required={false}
          value={form.postalCode}
          onChange={(postalCode) => setForm({ ...form, postalCode })}
          error={errors.postalCode}
        />
      </div>
    </section>
  );
}
function OrderSummary({
  items,
  subtotal,
}: {
  items: CheckoutItem[];
  subtotal: number;
}) {
  return (
    <aside className="h-fit rounded-xl border border-border bg-card p-5 lg:sticky lg:top-6">
      <p className="eyebrow text-muted-foreground">Order summary</p>
      <ul className="mt-5 space-y-4">
        {items.map(({ product, variant, quantity }) => (
          <li key={`${product.id}-${variant.id}`} className="flex items-center gap-3">
            <img
              src={product.images[0]}
              alt=""
              className="size-16 shrink-0 rounded-md object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{product.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {product.category} · {Object.entries(variant.attributes)
                  .filter(([, value]) => value)
                  .map(([name, value]) => `${name}: ${value}`)
                  .join(" · ") || variant.sku} · Quantity {quantity}
              </p>
              <p className="mt-1 text-sm font-medium">
                {formatPrice(variant.price * quantity)}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex justify-between border-t border-border pt-4">
        <span className="font-medium">Total</span>
        <span className="font-medium">{formatPrice(subtotal)}</span>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        Shipping will be calculated when delivery settings are added.
      </p>
    </aside>
  );
}
export function OrderConfirmation({
  title,
  message,
  orderId,
  state = "success",
}: {
  title: string;
  message: string;
  orderId?: string | null;
  state?: "success" | "pending" | "error";
}) {
  const ConfirmationIcon =
    state === "pending"
      ? LoaderCircle
      : state === "error"
        ? CircleAlert
        : CheckCircle2;
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 text-center">
      <div className="max-w-md rounded-3xl border border-border bg-card p-8">
        <ConfirmationIcon
          className={`mx-auto size-12 ${
            state === "pending"
              ? "animate-spin text-muted-foreground"
              : state === "error"
                ? "text-destructive"
                : "text-clay"
          }`}
          strokeWidth={1.25}
        />
        <p className="eyebrow mt-5 text-clay">
          {state === "pending"
            ? "Secure payment check"
            : state === "error"
              ? "Payment status"
              : "Thank you"}
        </p>
        <h1 className="mt-3 font-serif text-4xl">{title}</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {message}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-4 text-sm">
          {orderId && (
            <a
              href={`/orders/${encodeURIComponent(orderId)}`}
              className="font-medium text-clay underline underline-offset-4"
            >
              Track your order
            </a>
          )}
          <a href="/" className="underline underline-offset-4">
            Return to the shop
          </a>
        </div>
      </div>
    </main>
  );
}
export function StripeCheckoutSuccessPage() {
  const sessionId = new URLSearchParams(window.location.search).get(
    "session_id",
  );
  const { clearCart } = useCart();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [status, setStatus] = useState<"waiting" | "paid" | "error">(() =>
    sessionId ? "waiting" : "error",
  );
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    let timer: number | undefined;
    const check = async () => {
      try {
        const order = await apiRequest<{ paymentStatus: string; orderId: string }>(
          `/checkout/stripe/session/${encodeURIComponent(sessionId)}`,
        );
        if (cancelled) return;
        setOrderId(order.orderId);
        if (order.paymentStatus === "paid") {
          await clearCart();
          if (!cancelled) setStatus("paid");
          return;
        }
        timer = window.setTimeout(check, 1500);
      } catch {
        if (!cancelled) setStatus("error");
      }
    };
    void check();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [clearCart, sessionId]);
  return status === "paid" ? (
    <OrderConfirmation
      title="Payment confirmed"
      message="Your payment was verified and your order is now being prepared."
      orderId={orderId}
    />
  ) : (
    <OrderConfirmation
      title={
        status === "error"
          ? "We could not find this order"
          : "Confirming payment"
      }
      message={
        status === "error"
          ? "If your card was charged, please contact support with your Stripe receipt."
          : "We are waiting for Stripe's secure confirmation. This usually takes only a moment."
      }
      orderId={orderId}
      state={status === "waiting" ? "pending" : "error"}
    />
  );
}
