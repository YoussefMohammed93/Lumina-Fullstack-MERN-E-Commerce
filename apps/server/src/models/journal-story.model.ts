import { Schema, model } from "mongoose";

export type JournalStoryStatus = "draft" | "published";

export interface IJournalStory {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  image: string;
  imageAlt: string;
  body: string[];
  relatedProductCategory?: string;
  readMinutes: number;
  status: JournalStoryStatus;
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const journalStorySchema = new Schema<IJournalStory>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
    },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    excerpt: { type: String, required: true, trim: true, maxlength: 500 },
    image: { type: String, required: true, trim: true, maxlength: 2048 },
    imageAlt: { type: String, trim: true, maxlength: 240, default: "" },
    body: {
      type: [{ type: String, trim: true, maxlength: 5000 }],
      required: true,
      validate: {
        validator: (paragraphs: string[]) =>
          paragraphs.length > 0 && paragraphs.length <= 100,
        message: "A journal story must contain between 1 and 100 paragraphs.",
      },
    },
    relatedProductCategory: { type: String, trim: true, maxlength: 100 },
    readMinutes: { type: Number, required: true, min: 1, max: 120 },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    publishedAt: { type: Date },
  },
  { timestamps: true },
);

journalStorySchema.index({ status: 1, publishedAt: -1 });
journalStorySchema.index({ title: "text", category: "text", excerpt: "text" });

export const JournalStory = model<IJournalStory>(
  "JournalStory",
  journalStorySchema,
);
