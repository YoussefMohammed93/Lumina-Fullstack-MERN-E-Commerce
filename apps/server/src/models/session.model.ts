import { Schema, model, Types } from "mongoose";

interface ISession {
  userId: Types.ObjectId;
  tokenHash: string;
  csrfToken: string;
  expiresAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: { type: String, required: true, unique: true },
    csrfToken: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);

export const Session = model<ISession>("Session", sessionSchema);
