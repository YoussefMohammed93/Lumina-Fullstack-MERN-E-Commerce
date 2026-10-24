import { Schema, model } from "mongoose";

export interface ISavedAddress {
  name?: string;
  phone?: string;
  governorate?: string;
  line1?: string;
  line2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export interface IUserPreferences {
  orderUpdates: boolean;
  studioLetters: boolean;
}

export interface IUser {
  username: string;
  name?: string;
  email: string;
  phone?: string;
  savedAddress?: ISavedAddress;
  preferences: IUserPreferences;
  passwordHash?: string;
  avatarUrl?: string;
  avatarPublicId?: string;
  googleSubject?: string;
  role: "user" | "admin";
  status: "active" | "disabled";
}

const savedAddressSchema = new Schema<ISavedAddress>(
  {
    name: { type: String, trim: true, maxlength: 80 },
    phone: { type: String, trim: true, maxlength: 32 },
    governorate: { type: String, trim: true, maxlength: 80 },
    line1: { type: String, trim: true, maxlength: 160 },
    line2: { type: String, trim: true, maxlength: 160 },
    city: { type: String, trim: true, maxlength: 80 },
    postalCode: { type: String, trim: true, maxlength: 20 },
    country: { type: String, trim: true, maxlength: 2 },
  },
  { _id: false },
);

const preferencesSchema = new Schema<IUserPreferences>(
  {
    orderUpdates: { type: Boolean, default: false },
    studioLetters: { type: Boolean, default: false },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    name: { type: String, trim: true, maxlength: 80 },
    phone: { type: String, trim: true, maxlength: 32 },
    savedAddress: { type: savedAddressSchema, default: undefined },
    preferences: { type: preferencesSchema, default: () => ({}) },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    passwordHash: { type: String, select: false },
    avatarUrl: { type: String, trim: true },
    avatarPublicId: { type: String, trim: true },
    googleSubject: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    status: { type: String, enum: ["active", "disabled"], default: "active" },
  },

  { timestamps: true },
);

export const User = model<IUser>("User", userSchema);
