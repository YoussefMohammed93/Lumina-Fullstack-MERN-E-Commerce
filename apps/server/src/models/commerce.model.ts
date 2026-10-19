import { Schema, model } from "mongoose";

const cartSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [
      {
        productId: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
  },
  { timestamps: true },
);

const wishlistSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    productIds: [{ type: String, required: true }],
  },
  { timestamps: true },
);

const reviewSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ["pending", "published", "rejected"],
      default: "pending",
    },
  },

  { timestamps: true },
);

reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const Cart = model("Cart", cartSchema);
export const Wishlist = model("Wishlist", wishlistSchema);
export const Review = model("Review", reviewSchema);
