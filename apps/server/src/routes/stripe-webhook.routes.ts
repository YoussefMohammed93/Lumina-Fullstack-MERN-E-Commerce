import { Router } from "express";
import type Stripe from "stripe";
import { Order } from "../models/order.model.js";
import { Cart } from "../models/commerce.model.js";
import { User } from "../models/user.model.js";
import { getStripe } from "../lib/stripe.js";
import { inventoryForOrderItems, restoreInventory } from "../lib/inventory.js";
import {
  orderNumberForId,
  stripeShippingAddress,
} from "../lib/orders.js";
import {
  notifyOrderPayment,
  notifyOrderStatus,
} from "../lib/notifications.js";

const router = Router();

router.post("/", async (req, res) => {
  const signature = req.header("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    console.error(
      "Stripe webhook rejected: signature or STRIPE_WEBHOOK_SECRET is missing.",
    );
    return res.status(400).send("Webhook configuration is missing.");
  }
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      req.body,
      signature,
      webhookSecret,
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return res
      .status(400)
      .send(
        `Webhook signature verification failed: ${error instanceof Error ? error.message : "unknown error"}`,
      );
  }
  try {
    console.info(`Stripe webhook received: ${event.type} (${event.id})`);
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      // Some Stripe CLI/Event Destination configurations forward a thin event.
      // Retrieve the session from Stripe so the verified webhook works with both
      // thin and snapshot payloads and always uses Stripe's current payment status.
      const eventSession = event.data.object as Stripe.Checkout.Session;
      const session = await getStripe().checkout.sessions.retrieve(
        eventSession.id,
      );
      if (session.payment_status === "paid") {
        const metadata = session.metadata ?? {};
        const shippingAddress = stripeShippingAddress(session);
        const update = {
          paymentStatus: "paid" as const,
          stripePaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : undefined,
          ...(shippingAddress ? { shippingAddress } : {}),
        };
        const pendingOrder =
          (await Order.findOne({
            stripeCheckoutSessionId: session.id,
            paymentStatus: { $ne: "paid" },
          })) ??
          (metadata.orderId
            ? await Order.findOne({
                _id: metadata.orderId,
                paymentStatus: { $ne: "paid" },
              })
            : null);
        if (pendingOrder && shippingAddress?.line1) {
          await User.updateOne(
            { _id: pendingOrder.userId },
            { $set: { savedAddress: shippingAddress } },
          );
        }
        const order = pendingOrder
          ? await Order.findOneAndUpdate(
              { _id: pendingOrder._id, paymentStatus: { $ne: "paid" } },
              update,
              { new: true },
            )
          : null;
        if (!order) {
          console.warn(
            `Stripe webhook could not find a pending order for session ${session.id}.`,
          );
        } else {
          const changedAt = new Date();
          await notifyOrderPayment({
            orderId: String(order._id),
            orderNumber:
              order.orderNumber ?? orderNumberForId(String(order._id)),
            paymentStatus: "paid",
          });
          if (
            order.fulfillmentStatus === "placed" ||
            order.fulfillmentStatus === "pending"
          ) {
            const statusUpdate = await Order.updateOne(
              {
                _id: order._id,
                fulfillmentStatus: { $in: ["placed", "pending"] },
              },
              {
                $set: { fulfillmentStatus: "confirmed" },
                $push: {
                  statusHistory: { status: "confirmed", at: changedAt },
                },
              },
            );
            if (statusUpdate.modifiedCount === 1)
              await notifyOrderStatus({
                orderId: String(order._id),
                orderNumber:
                  order.orderNumber ??
                  orderNumberForId(String(order._id)),
                status: "confirmed",
                changedAt,
              });
          }
          await Cart.updateOne(
            { userId: order.userId },
            { $set: { items: [] } },
          );
          console.info(
            `Stripe payment confirmed and cart cleared for order ${order.id}.`,
          );
        }
      } else {
        console.warn(
          `Stripe session ${session.id} is not paid yet (status: ${session.payment_status}).`,
        );
      }
    }
    if (
      event.type === "checkout.session.expired" ||
      event.type === "checkout.session.async_payment_failed"
    ) {
      const order = await Order.findOneAndUpdate(
        {
          stripeCheckoutSessionId: event.data.object.id,
          paymentStatus: "pending",
        },
        { $set: { paymentStatus: "failed" } },
        { new: true },
      ).lean();
      if (order) {
        await notifyOrderPayment({
          orderId: String(order._id),
          orderNumber: order.orderNumber ?? orderNumberForId(String(order._id)),
          paymentStatus: "failed",
        });
        try {
          await restoreInventory(inventoryForOrderItems(order.items));
        } catch (error) {
          await Order.updateOne(
            { _id: order._id, paymentStatus: "failed" },
            { $set: { paymentStatus: "pending" } },
          );
          throw error;
        }
      }
    }
    res.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing failed", error);
    res.status(500).send("Webhook processing failed.");
  }
});

export default router;
