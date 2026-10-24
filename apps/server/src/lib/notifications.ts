import {
  AdminNotification,
  type AdminNotificationType,
} from "../models/notification.model.js";

interface AdminNotificationInput {
  eventKey: string;
  type: AdminNotificationType;
  title: string;
  message: string;
  href: string;
}

export async function createAdminNotification(
  notification: AdminNotificationInput,
): Promise<void> {
  try {
    await AdminNotification.updateOne(
      { eventKey: notification.eventKey },
      {
        $setOnInsert: {
          ...notification,
          readBy: [],
        },
      },
      { upsert: true },
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    )
      return;
    throw error;
  }
}

async function publish(
  eventKey: string,
  notification: AdminNotificationInput,
): Promise<void> {
  try {
    await createAdminNotification(notification);
  } catch (error) {
    console.error(`Unable to publish admin notification ${eventKey}.`, error);
  }
}

export function notifyNewOrder(input: {
  orderId: string;
  orderNumber: string;
  customer: string;
  amountTotal: number;
}): Promise<void> {
  const eventKey = `new-order:${input.orderId}`;
  return publish(eventKey, {
    eventKey,
    type: "new_order",
    title: `New order ${input.orderNumber}`,
    message: `${input.customer} placed an order for EGP ${(input.amountTotal / 100).toLocaleString("en-EG", { maximumFractionDigits: 2 })}.`,
    href: `/admin/orders?search=${encodeURIComponent(input.orderNumber)}`,
  });
}

export function notifyOrderStatus(input: {
  orderId: string;
  orderNumber: string;
  status: string;
  changedAt: Date;
  paymentCollected?: boolean;
}): Promise<void> {
  const readableStatus = input.status.replaceAll("_", " ");
  const eventKey = `order-status:${input.orderId}:${input.changedAt.getTime()}`;
  return publish(eventKey, {
    eventKey,
    type: "order_status",
    title: `Order ${input.orderNumber} updated`,
    message: input.paymentCollected
      ? `Marked ${readableStatus}; cash payment collected.`
      : `Fulfillment status changed to ${readableStatus}.`,
    href: `/admin/orders?search=${encodeURIComponent(input.orderNumber)}`,
  });
}

export function notifyOrderPayment(input: {
  orderId: string;
  orderNumber: string;
  paymentStatus: string;
}): Promise<void> {
  const eventKey = `order-payment:${input.orderId}:${input.paymentStatus}`;
  return publish(eventKey, {
    eventKey,
    type: "order_status",
    title: `Payment ${input.paymentStatus} for ${input.orderNumber}`,
    message:
      input.paymentStatus === "paid"
        ? "Payment was confirmed for this order."
        : `Payment status changed to ${input.paymentStatus}.`,
    href: `/admin/orders?search=${encodeURIComponent(input.orderNumber)}`,
  });
}

export function notifyNewCustomer(input: {
  userId: string;
  customer: string;
}): Promise<void> {
  const eventKey = `new-customer:${input.userId}`;
  return publish(eventKey, {
    eventKey,
    type: "new_customer",
    title: "New customer registered",
    message: `${input.customer} created a customer account.`,
    href: "/admin/customers",
  });
}

export function notifyLowStock(input: {
  eventKey: string;
  productName: string;
  sku: string;
  stock: number;
}): Promise<void> {
  return publish(input.eventKey, {
    eventKey: input.eventKey,
    type: "low_stock",
    title: input.stock === 0 ? "Product out of stock" : "Low stock alert",
    message: `${input.productName} (${input.sku}) has ${input.stock} unit${input.stock === 1 ? "" : "s"} remaining.`,
    href: `/admin/products?search=${encodeURIComponent(input.sku)}`,
  });
}
