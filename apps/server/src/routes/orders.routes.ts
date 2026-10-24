import { isValidObjectId, type Types } from "mongoose";
import { Router } from "express";
import {
  Order,
  type IOrder,
} from "../models/order.model.js";
import type { IUser } from "../models/user.model.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  normalizedFulfillmentStatus,
  orderCreatedAt,
  orderNumberForId,
} from "../lib/orders.js";

const router = Router();
router.use(requireAuth);

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function positiveInteger(value: unknown, fallback: number, max: number) {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0
    ? Math.min(parsed, max)
    : fallback;
}

type OrderRecord = IOrder & { _id: Types.ObjectId };
type OrderUser = IUser & { _id: Types.ObjectId };

function presentOrder(order: OrderRecord, user: OrderUser) {
  const id = String(order._id);
  const createdAt = orderCreatedAt(order);
  const updatedAt = order.updatedAt ?? createdAt;
  const history = Array.isArray(order.statusHistory)
    ? order.statusHistory.map((entry) => ({ status: entry.status, at: entry.at }))
    : [];

  if (!history.length) {
    history.push({
      status: "placed",
      at: createdAt,
    });
    const status = normalizedFulfillmentStatus(order.fulfillmentStatus);
    if (status !== "placed") {
      history.push({
        status,
        at: updatedAt,
      });
    }
  }
  if (history[0]?.status !== "placed")
    history.unshift({ status: "placed", at: createdAt });

  const address = order.shippingAddress ?? {};
  const addressLines = [
    address.line1,
    address.line2,
    [address.city, address.governorate].filter(Boolean).join(", "),
    address.postalCode,
    address.country === "EG" ? "Egypt" : address.country,
  ].filter((line): line is string => Boolean(line));

  return {
    id,
    orderNumber: order.orderNumber ?? orderNumberForId(id),
    placedAt: createdAt,
    estimatedDelivery:
      order.estimatedDelivery ??
      new Date(createdAt.getTime() + 4 * 24 * 60 * 60 * 1000),
    currentStage: normalizedFulfillmentStatus(order.fulfillmentStatus),
    timeline: history,
    items: order.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      sku: item.sku,
      attributes: item.attributes ?? {},
      name: item.name,
      unitAmount: item.unitAmount,
      quantity: item.quantity,
    })),
    paymentMethod:
      order.paymentMethod === "cash_on_delivery"
        ? "Cash on delivery"
        : "Card payment",
    paymentStatus:
      order.paymentStatus === "paid"
        ? "Paid"
        : order.paymentStatus === "awaiting_cod"
          ? "Awaiting payment"
          : order.paymentStatus === "failed"
            ? "Failed"
            : "Pending",
    shipping: {
      name: address.name ?? user.name ?? user.username,
      phone: address.phone ?? "",
      address: addressLines,
    },
    shippingAmount: 0,
    amountTotal: order.amountTotal,
    currency: order.currency,
  };
}

router.get("/orders", async (req, res, next) => {
  try {
    const page = positiveInteger(req.query.page, 1, Number.MAX_SAFE_INTEGER);
    const limit = positiveInteger(
      req.query.limit,
      DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE,
    );
    const filter = { userId: req.user!._id };
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        orders: orders.map((order) => presentOrder(order, req.user!)),
        pagination: {
          page,
          limit,
          total,
          pageCount: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/orders/:orderId", async (req, res, next) => {
  try {
    const identity = isValidObjectId(req.params.orderId)
      ? { _id: req.params.orderId }
      : { orderNumber: req.params.orderId };
    const order = await Order.findOne({
      ...identity,
      userId: req.user!._id,
    }).lean();

    if (!order)
      return res
        .status(404)
        .json({ success: false, error: { message: "Order not found." } });

    res.json({
      success: true,
      data: { order: presentOrder(order, req.user!) },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
