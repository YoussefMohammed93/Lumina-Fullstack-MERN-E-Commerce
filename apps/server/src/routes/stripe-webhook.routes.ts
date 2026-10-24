import { Router } from "express";
import type Stripe from "stripe";
import { Order } from "../models/order.model.js";
import { Cart } from "../models/commerce.model.js";
import { getStripe } from "../lib/stripe.js";
import { inventoryForOrderItems, restoreInventory } from "../lib/inventory.js";
import { stripeShippingAddress } from "../lib/orders.js";

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
        const order = metadata.orderId
          ? await Order.findOneAndUpdate(
              {
                $or: [
                  { stripeCheckoutSessionId: session.id },
                  { _id: metadata.orderId },
                ],
                paymentStatus: { $ne: "paid" },
              },
              update,
              { new: true },
            )
          : await Order.findOneAndUpdate(
              { stripeCheckoutSessionId: session.id, paymentStatus: { $ne: "paid" } },
              update,
              { new: true },
            );
        if (!order) {
          console.warn(
            `Stripe webhook could not find a pending order for session ${session.id}.`,
          );
        } else {
          if (
            order.fulfillmentStatus === "placed" ||
            order.fulfillmentStatus === "pending"
          ) {
            const changedAt = new Date();
            await Order.updateOne(
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
