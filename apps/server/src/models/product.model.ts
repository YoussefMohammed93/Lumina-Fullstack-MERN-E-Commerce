import mongoose, { Schema, type Types } from "mongoose";

export type ProductStatus = "draft" | "active" | "archived";
export type ProductBadge = "new" | "limited" | "sale";

export interface IProductImage {
  url: string;
  publicId?: string;
  alt: string;
  sortOrder: number;
}

export interface IProductVariant {
  sku: string;
  attributes: Record<string, string>;
  price: number;
  compareAtPrice?: number;
  stock: number;
  isActive: boolean;
}

export interface IProduct {
  name: string;
  slug: string;
  description: string;
  brand?: string;
  categoryId: Types.ObjectId;
  images: IProductImage[];
  materials?: string;
  dimensions?: string;
  badge?: ProductBadge;
  cashOnDeliveryAvailable: boolean;
  status: ProductStatus;
  trashedAt?: Date;
  variants: IProductVariant[];
  averageRating: number;
  reviewCount: number;
}

const imageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true },
    alt: { type: String, trim: true, default: "" },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false },
);

const variantSchema = new Schema<IProductVariant>(
  {
    sku: { type: String, required: true, trim: true, uppercase: true },
    attributes: { type: Schema.Types.Mixed, default: {} },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: true },
);

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    brand: { type: String, trim: true, maxlength: 120 },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    images: { type: [imageSchema], default: [] },
    materials: { type: String, trim: true, maxlength: 500 },
    dimensions: { type: String, trim: true, maxlength: 300 },
    badge: { type: String, enum: ["new", "limited", "sale"] },
    cashOnDeliveryAvailable: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
      index: true,
    },
    trashedAt: { type: Date, default: null, index: true },
    variants: {
      type: [variantSchema],
      validate: {
        validator: (value: IProductVariant[]) => value.length > 0,
        message: "At least one variant is required.",
      },
    },
    averageRating: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true },
);

productSchema.index({ status: 1, categoryId: 1 });
productSchema.index({ "variants.sku": 1 }, { unique: true });

export const Product = mongoose.model<IProduct>("Product", productSchema);
