import { Schema, model, type Types } from "mongoose";

export interface IOrderItem {
  productId: string;
  variantId: string;
  sku: string;
  attributes: Record<string, string>;
  name: string;
  unitAmount: number;
  quantity: number;
}

export interface IShippingAddress {
  name?: string;
  phone?: string;
  governorate?: string;
  line1?: string;
  line2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export interface IOrder {
  userId: Types.ObjectId;
  items: IOrderItem[];
  currency: string;
  amountTotal: number;
  paymentMethod: "stripe" | "cash_on_delivery";
  paymentStatus: "pending" | "paid" | "awaiting_cod" | "failed";
  fulfillmentStatus:
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  shippingAddress?: IShippingAddress;
}

const orderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: [
      {
        productId: String,
        variantId: String,
        sku: String,
        attributes: Schema.Types.Mixed,
        name: String,
        unitAmount: Number,
        quantity: Number,
      },
    ],
    currency: { type: String, default: "egp" },
    amountTotal: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["stripe", "cash_on_delivery"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "awaiting_cod", "failed"],
      required: true,
    },
    fulfillmentStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    stripeCheckoutSessionId: { type: String, unique: true, sparse: true },
    stripePaymentIntentId: { type: String, sparse: true },
    shippingAddress: {
      name: String,
      phone: String,
      governorate: String,
      line1: String,
      line2: String,
      city: String,
      postalCode: String,
      country: String,
    },
  },
  { timestamps: true },
);

export const Order = model<IOrder>("Order", orderSchema);
