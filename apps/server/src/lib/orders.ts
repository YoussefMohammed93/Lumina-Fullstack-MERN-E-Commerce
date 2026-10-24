import { Order, type IOrder, type OrderFulfillmentStatus } from "../models/order.model.js";
import type Stripe from "stripe";
import { Product } from "../models/product.model.js";

const DELIVERY_WINDOW_DAYS = 4;

export function orderNumberForId(id: string): string {
  return `LM-${id.slice(-8).toUpperCase()}`;
}

export async function createOrderRecord(
  input: Omit<IOrder, "orderNumber" | "estimatedDelivery" | "statusHistory">,
) {
  const order = new Order(input);
  const now = new Date();
  const initialStatus: Exclude<OrderFulfillmentStatus, "pending"> =
    input.fulfillmentStatus === "pending" ? "placed" : input.fulfillmentStatus;

  order.orderNumber = orderNumberForId(String(order._id));
  order.estimatedDelivery = new Date(
    now.getTime() + DELIVERY_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );
  order.fulfillmentStatus = initialStatus;
  order.statusHistory =
    initialStatus === "confirmed"
      ? [
          { status: "placed", at: now },
          { status: "confirmed", at: now },
        ]
      : [{ status: initialStatus, at: now }];

  return order.save();
}

export function normalizedFulfillmentStatus(
  status: OrderFulfillmentStatus | undefined,
): Exclude<OrderFulfillmentStatus, "pending"> {
  return status === "pending" || !status ? "placed" : status;
}

export function stripeShippingAddress(
  session: Stripe.Checkout.Session,
): IOrder["shippingAddress"] | undefined {
  const details = session.collected_information?.shipping_details;
  const address = details?.address ?? session.customer_details?.address;
  if (!address && !details?.name && !session.customer_details?.name)
    return undefined;

  return {
    name:
      details?.name ??
      session.customer_details?.name ??
      undefined,
    phone: session.customer_details?.phone ?? undefined,
    governorate: address?.state ?? undefined,
    line1: address?.line1 ?? undefined,
    line2: address?.line2 ?? undefined,
    city: address?.city ?? undefined,
    postalCode: address?.postal_code ?? undefined,
    country: address?.country ?? undefined,
  };
}

export async function paidRevenueTotal(): Promise<number> {
  const paidOrders = await Order.find({
    $or: [
      { paymentStatus: "paid" },
      {
        paymentMethod: "cash_on_delivery",
        fulfillmentStatus: "delivered",
      },
    ],
  })
    .select("amountTotal items")
    .lean();

  if (!paidOrders.length) return 0;

  const productIds = [
    ...new Set(paidOrders.flatMap((order) => order.items.map((item) => item.productId))),
  ];
  const products = await Product.find({ _id: { $in: productIds } })
    .select("variants._id variants.price")
    .lean();
  const variantPrices = new Map<string, number>();
  for (const product of products) {
    for (const variant of product.variants) {
      variantPrices.set(
        `${String(product._id)}:${variant.sku}`,
        variant.price,
      );
    }
  }

  return paidOrders.reduce((revenue, order) => {
    const itemTotal = order.items.reduce(
      (total, item) => total + item.unitAmount * item.quantity,
      0,
    );
    const previouslyOverScaled =
      order.items.length > 0 &&
      order.items.every((item) => {
        const price = variantPrices.get(
          `${item.productId}:${item.sku}`,
        );
        return price !== undefined && item.unitAmount === price * 100;
      });

    return (
      revenue +
      (previouslyOverScaled && order.amountTotal === itemTotal
        ? order.amountTotal / 100
        : order.amountTotal)
    );
  }, 0);
}

export function orderCreatedAt(order: Pick<IOrder, "createdAt">) {
  if (!order.createdAt)
    throw new Error("Order is missing its creation timestamp.");
  return order.createdAt;
}
