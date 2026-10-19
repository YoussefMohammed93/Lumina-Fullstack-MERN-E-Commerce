import { Schema, model } from "mongoose";

export interface IUser {
  username: string;
  name?: string;
  email: string;
  passwordHash?: string;
  avatarUrl?: string;
  googleSubject?: string;
  role: "user" | "admin";
  status: "active" | "disabled";
}

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
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    passwordHash: { type: String, select: false },
    avatarUrl: { type: String, trim: true },
    googleSubject: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    status: { type: String, enum: ["active", "disabled"], default: "active" },
  },

  { timestamps: true },
);

export const User = model<IUser>("User", userSchema);
