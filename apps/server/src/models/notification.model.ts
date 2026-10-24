import { Schema, model, type Types } from "mongoose";

export type AdminNotificationType =
  | "new_order"
  | "order_status"
  | "low_stock"
  | "new_customer";

export interface IAdminNotification {
  eventKey: string;
  type: AdminNotificationType;
  title: string;
  message: string;
  href: string;
  readBy: Types.ObjectId[];
  createdAt?: Date;
}

const notificationSchema = new Schema<IAdminNotification>(
  {
    eventKey: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ["new_order", "order_status", "low_stock", "new_customer"],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    href: { type: String, required: true, trim: true },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

notificationSchema.index({ createdAt: -1 });

export const AdminNotification = model<IAdminNotification>(
  "AdminNotification",
  notificationSchema,
);
