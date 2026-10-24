import { Router } from "express";
import { Cart } from "../models/commerce.model.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { getStripe } from "../lib/stripe.js";
import { requireAuth, requireCsrf } from "../middleware/auth.middleware.js";
import { createOrderRecord, stripeShippingAddress } from "../lib/orders.js";
import {
  inventoryForOrderItems,
  reserveInventory,
  restoreInventory,
  type InventoryReservationItem,
} from "../lib/inventory.js";

const router = Router();
router.use(requireAuth);

const governorates = new Set([
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
]);

async function cartItemsForCheckout(userId: string) {
  const cart = await Cart.findOne({ userId }).lean();
  if (!cart?.items.length) throw new Error("Your bag is empty.");

  return Promise.all(
    cart.items.map(async (line) => {
      const product = await Product.findOne({
        _id: line.productId,
        status: "active",
        trashedAt: null,
      }).lean();
      const variant = product?.variants.find(
        (item: any) => String(item._id) === line.variantId && item.isActive,
      ) as any;
      if (
        !product ||
        !variant ||
        line.quantity < 1 ||
        line.quantity > variant.stock
      )
        throw new Error(
          "One or more products are unavailable. Please review your bag.",
        );
      return {
        id: String(product._id),
        variantId: String(variant._id),
        sku: variant.sku,
        attributes: variant.attributes,
        name: product.name,
        price: variant.price,
        stock: variant.stock,
        cashOnDeliveryAvailable: product.cashOnDeliveryAvailable,
        quantity: line.quantity,
      };
    }),
  );
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

router.post("/checkout/stripe", requireCsrf, async (req, res, next) => {
  let reservedItems: InventoryReservationItem[] = [];
  let createdOrderId: string | undefined;
  try {
    const items = await cartItemsForCheckout(String(req.user!._id));
    const requestedItems = inventoryForOrderItems(
      items.map((item) => ({
        productId: item.id,
        variantId: item.variantId,
        quantity: item.quantity,
      })),
    );
    await reserveInventory(requestedItems);
    reservedItems = requestedItems;

    const order = await createOrderRecord({
      userId: req.user!._id,
      currency: "egp",
      items: items.map(
        ({ id, variantId, sku, attributes, name, price, quantity }) => ({
          productId: id,
          variantId,
          sku,
          attributes,
          name,
          unitAmount: price,
          quantity,
        }),
      ),

      amountTotal: items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      ),

      paymentMethod: "stripe",
      paymentStatus: "pending",
      fulfillmentStatus: "placed",
    });
    createdOrderId = String(order._id);
    const origin = process.env.CLIENT_ORIGIN ?? "http://localhost:3000";

    const session = await getStripe().checkout.sessions.create(
      {
        mode: "payment",
        customer_email: req.user!.email,
        client_reference_id: String(order._id),
        metadata: { orderId: String(order._id), userId: String(req.user!._id) },
        line_items: items.map((item) => ({
          price_data: {
            currency: "egp",
            product_data: { name: item.name },
            unit_amount: item.price,
          },
          quantity: item.quantity,
        })),
        shipping_address_collection: { allowed_countries: ["EG"] },
        phone_number_collection: { enabled: true },
        success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout/cancel`,
      },
      { idempotencyKey: `checkout-order-${String(order._id)}` },
    );

    await Order.findByIdAndUpdate(order._id, {
      stripeCheckoutSessionId: session.id,
    });

    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    reservedItems = [];
    res.status(201).json({ success: true, data: { url: session.url } });
  } catch (error) {
    try {
      if (reservedItems.length) await restoreInventory(reservedItems);
      if (createdOrderId) await Order.deleteOne({ _id: createdOrderId });
    } catch (rollbackError) {
      next(rollbackError);
      return;
    }
    next(error);
  }
});

router.post(
  "/checkout/cash-on-delivery",
  requireCsrf,
  async (req, res, next) => {
    let reservedItems: InventoryReservationItem[] = [];
    try {
      const body = req.body as Record<string, unknown>;
      const name = optionalString(body.name);
      const phone = optionalString(body.phone);
      const governorate = optionalString(body.governorate);
      const line1 = optionalString(body.line1);
      const line2 = optionalString(body.line2);
      const city = optionalString(body.city);
      const postalCode = optionalString(body.postalCode);
      if (!name || !phone || !governorate || !line1)
        return res.status(400).json({
          success: false,
          error: {
            message: "Name, phone, governorate, and address are required.",
          },
        });

      if (!governorates.has(governorate))
        return res.status(400).json({
          success: false,
          error: { message: "Please choose a governorate in Egypt." },
        });

      const items = await cartItemsForCheckout(String(req.user!._id));
      if (items.some((item) => !item.cashOnDeliveryAvailable))
        return res.status(400).json({
          success: false,
          error: {
            message:
              "Cash on delivery is unavailable for one or more items in your bag.",
          },
        });

      const requestedItems = inventoryForOrderItems(
        items.map((item) => ({
          productId: item.id,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      );
      await reserveInventory(requestedItems);
      reservedItems = requestedItems;

      const order = await createOrderRecord({
        userId: req.user!._id,
        currency: "egp",
        items: items.map(
          ({
            id,
            variantId,
            sku,
            attributes,
            name: productName,
            price,
            quantity,
          }) => ({
            productId: id,
            variantId,
            sku,
            attributes,
            name: productName,
            unitAmount: price,
            quantity,
          }),
        ),
        amountTotal: items.reduce(
          (total, item) => total + item.price * item.quantity,
          0,
        ),
        paymentMethod: "cash_on_delivery",
        paymentStatus: "awaiting_cod",
        fulfillmentStatus: "confirmed",
        shippingAddress: {
          name,
          phone,
          governorate,
          line1,
          line2,
          city,
          postalCode,
          country: "EG",
        },
      });
      reservedItems = [];

      await Cart.updateOne({ userId: req.user!._id }, { $set: { items: [] } });

      res
        .status(201)
        .json({ success: true, data: { orderId: String(order._id) } });
    } catch (error) {
      try {
        if (reservedItems.length) await restoreInventory(reservedItems);
      } catch (rollbackError) {
        next(rollbackError);
        return;
      }
      next(error);
    }
  },
);

router.get("/checkout/stripe/session/:sessionId", async (req, res, next) => {
  try {
    let order = await Order.findOne({
      stripeCheckoutSessionId: req.params.sessionId,
      userId: req.user!._id,
    }).lean();
    if (!order)
      return res
        .status(404)
        .json({ success: false, error: { message: "Order not found." } });
    // Webhooks remain the normal payment-confirmation path. This is a safe
    // reconciliation fallback for the hosted Checkout return: the server asks
    // Stripe directly, verifies the session belongs to this exact order/user,
    // and never accepts a payment result supplied by the browser.
    const session = await getStripe().checkout.sessions.retrieve(
      req.params.sessionId,
    );
    if (
      session.payment_status === "paid" &&
      (session.metadata?.orderId ?? "") === String(order._id) &&
      (session.metadata?.userId ?? "") === String(req.user!._id)
    ) {
      const shippingAddress = stripeShippingAddress(session);
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : undefined;
      await Order.updateOne(
        { _id: order._id },
        {
          $set: {
            paymentStatus: "paid",
            ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
            ...(shippingAddress ? { shippingAddress } : {}),
          },
        },
      );
      if (
        order.fulfillmentStatus === "placed" ||
        order.fulfillmentStatus === "pending"
      ) {
        await Order.updateOne(
          {
            _id: order._id,
            fulfillmentStatus: { $in: ["placed", "pending"] },
          },
          {
            $set: { fulfillmentStatus: "confirmed" },
            $push: {
              statusHistory: { status: "confirmed", at: new Date() },
            },
          },
        );
      }
      order = await Order.findById(order._id).lean();
    }
    // Make the post-payment status request idempotently enforce an empty cart.
    // This protects the buyer from a stale cart if an earlier cart write raced
    // with the webhook while they were returning from hosted Checkout.
    if (order?.paymentStatus === "paid") {
      await Cart.updateOne({ userId: req.user!._id }, { $set: { items: [] } });
    }
    if (!order)
      throw new Error(
        "Order could not be retrieved after payment reconciliation.",
      );
    res.json({
      success: true,
      data: {
        id: String(order._id),
        orderId: String(order._id),
        paymentStatus: order.paymentStatus,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
