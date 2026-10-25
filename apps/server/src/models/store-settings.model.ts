import { Schema, model } from "mongoose";
import { EGYPT_GOVERNORATES } from "../lib/governorates.js";

export interface IShippingRate {
  governorate: string;
  price: number | null;
}

export interface IStoreSettings {
  key: string;
  storeName: string;
  contactEmail: string;
  phone: string;
  location: string;
  announcementEnabled: boolean;
  announcementText: string;
  shippingRates: IShippingRate[];
}

const shippingRateSchema = new Schema<IShippingRate>(
  {
    governorate: {
      type: String,
      enum: EGYPT_GOVERNORATES,
      required: true,
    },
    price: { type: Number, min: 0, max: 1_000_000, default: null },
  },
  { _id: false },
);

const storeSettingsSchema = new Schema<IStoreSettings>(
  {
    key: { type: String, required: true, unique: true, default: "store" },
    storeName: { type: String, required: true, trim: true, maxlength: 80 },
    contactEmail: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, maxlength: 30, default: "" },
    location: { type: String, required: true, trim: true, maxlength: 160 },
    announcementEnabled: { type: Boolean, default: false },
    announcementText: { type: String, trim: true, default: "" },
    shippingRates: { type: [shippingRateSchema], default: [] },
  },
  { timestamps: true },
);

export const StoreSettings = model<IStoreSettings>(
  "StoreSettings",
  storeSettingsSchema,
);
