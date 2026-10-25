import { Schema, model } from "mongoose";

export interface INewsletterSubscriber {
  email: string;
  createdAt?: Date;
}

const newsletterSubscriberSchema = new Schema<INewsletterSubscriber>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: 254,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

newsletterSubscriberSchema.index({ createdAt: -1 });

export const NewsletterSubscriber = model<INewsletterSubscriber>(
  "NewsletterSubscriber",
  newsletterSubscriberSchema,
);
