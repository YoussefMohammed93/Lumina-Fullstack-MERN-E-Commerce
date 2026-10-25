import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { JournalStory, type JournalStoryStatus } from "../models/journal-story.model.js";
import { requireAuth, requireCsrf, requireRole } from "../middleware/auth.middleware.js";

const journalRouter = Router();
const adminJournalRouter = Router();
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function positiveInteger(value: unknown, fallback: number, max: number) {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0
    ? Math.min(parsed, max)
    : fallback;
}

function presentStory(story: any) {
  return {
    id: String(story._id),
    slug: story.slug,
    category: story.category,
    title: story.title,
    excerpt: story.excerpt,
    image: story.image,
    imageAlt: story.imageAlt ?? "",
    body: story.body,
    relatedProductCategory: story.relatedProductCategory ?? "",
    readMinutes: story.readMinutes,
    status: story.status,
    publishedAt: story.publishedAt,
    createdAt: story.createdAt,
    updatedAt: story.updatedAt,
  };
}

function storyPayload(body: any) {
  const paragraphs: string[] = Array.isArray(body?.body)
    ? body.body.map(text).filter(Boolean)
    : typeof body?.body === "string"
      ? body.body
          .split(/\n\s*\n/)
          .map((paragraph: string) => paragraph.trim())
          .filter(Boolean)
      : [];
  const title = text(body?.title);
  const slug = slugify(text(body?.slug) || title);
  const status: JournalStoryStatus = body?.status;
  return {
    title,
    slug,
    category: text(body?.category),
    excerpt: text(body?.excerpt),
    image: text(body?.image),
    imageAlt: text(body?.imageAlt),
    body: paragraphs,
    relatedProductCategory: text(body?.relatedProductCategory),
    readMinutes:
      typeof body?.readMinutes === "number"
        ? body.readMinutes
        : Number.NaN,
    status,
  };
}

function validateStory(story: ReturnType<typeof storyPayload>) {
  if (!story.title || story.title.length > 160)
    return "Enter a title of 160 characters or fewer.";
  if (!story.slug || story.slug.length > 120)
    return "Enter a valid URL slug of 120 characters or fewer.";
  if (!story.category || story.category.length > 60)
    return "Enter a category of 60 characters or fewer.";
  if (!story.excerpt || story.excerpt.length > 500)
    return "Enter an introduction of 500 characters or fewer.";
  if (!story.image || story.image.length > 2048)
    return "Add a valid hero image URL.";
  try {
    const imageUrl = new URL(story.image);
    if (!["http:", "https:"].includes(imageUrl.protocol))
      return "The hero image must use an HTTP or HTTPS URL.";
  } catch {
    return "Add a valid hero image URL.";
  }
  if (story.imageAlt.length > 240)
    return "Image description must be 240 characters or fewer.";
  if (!story.body.length || story.body.length > 100)
    return "Add between 1 and 100 story paragraphs.";
  if (story.body.some((paragraph) => paragraph.length > 5000))
    return "Each paragraph must be 5,000 characters or fewer.";
  if (story.body.join("\n\n").length > 50000)
    return "The story must be 50,000 characters or fewer.";
  if (
    !Number.isInteger(story.readMinutes) ||
    story.readMinutes < 1 ||
    story.readMinutes > 120
  )
    return "Reading time must be a whole number from 1 to 120 minutes.";
  if (
    story.relatedProductCategory &&
    story.relatedProductCategory.length > 100
  )
    return "Related product category must be 100 characters or fewer.";
  if (story.status !== "draft" && story.status !== "published")
    return "Choose draft or published status.";
  return undefined;
}

journalRouter.get("/", async (_req, res, next) => {
  try {
    const stories = await JournalStory.find({ status: "published" })
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean();
    res.json({
      success: true,
      data: { stories: stories.map(presentStory) },
    });
  } catch (error) {
    next(error);
  }
});

journalRouter.get("/:slug", async (req, res, next) => {
  try {
    const story = await JournalStory.findOne({
      slug: req.params.slug,
      status: "published",
    }).lean();
    if (!story)
      return res.status(404).json({
        success: false,
        error: { message: "Journal story not found." },
      });
    res.json({ success: true, data: presentStory(story) });
  } catch (error) {
    next(error);
  }
});

adminJournalRouter.use(requireAuth, requireRole("admin"));

adminJournalRouter.get("/", async (req, res, next) => {
  try {
    const page = positiveInteger(req.query.page, 1, Number.MAX_SAFE_INTEGER);
    const limit = positiveInteger(req.query.limit, 20, 100);
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const filter: Record<string, unknown> = {};
    if (query) {
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matcher = new RegExp(escaped, "i");
      filter.$or = [
        { title: matcher },
        { slug: matcher },
        { category: matcher },
      ];
    }
    if (
      typeof req.query.status === "string" &&
      ["draft", "published"].includes(req.query.status)
    )
      filter.status = req.query.status;

    const [stories, total, publishedCount, draftCount] = await Promise.all([
      JournalStory.find(filter)
        .sort({ updatedAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      JournalStory.countDocuments(filter),
      JournalStory.countDocuments({ status: "published" }),
      JournalStory.countDocuments({ status: "draft" }),
    ]);
    res.json({
      success: true,
      data: {
        stories: stories.map(presentStory),
        counts: { total: publishedCount + draftCount, publishedCount, draftCount },
        pagination: {
          page,
          limit,
          total,
          pageCount: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

adminJournalRouter.post("/", requireCsrf, async (req, res, next) => {
  try {
    const payload = storyPayload(req.body);
    const validationError = validateStory(payload);
    if (validationError)
      return res.status(400).json({
        success: false,
        error: { message: validationError },
      });
    const duplicate = await JournalStory.exists({ slug: payload.slug });
    if (duplicate)
      return res.status(409).json({
        success: false,
        error: { message: "That journal URL is already in use." },
      });
    const story = await JournalStory.create({
      ...payload,
      publishedAt: payload.status === "published" ? new Date() : undefined,
    });
    res.status(201).json({ success: true, data: presentStory(story) });
  } catch (error) {
    next(error);
  }
});

adminJournalRouter.patch("/:id", requireCsrf, async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id))
      return res.status(400).json({
        success: false,
        error: { message: "Choose a valid journal story." },
      });
    const payload = storyPayload(req.body);
    const validationError = validateStory(payload);
    if (validationError)
      return res.status(400).json({
        success: false,
        error: { message: validationError },
      });
    const duplicate = await JournalStory.exists({
      slug: payload.slug,
      _id: { $ne: req.params.id },
    });
    if (duplicate)
      return res.status(409).json({
        success: false,
        error: { message: "That journal URL is already in use." },
      });

    const existing = await JournalStory.findById(req.params.id);
    if (!existing)
      return res.status(404).json({
        success: false,
        error: { message: "Journal story not found." },
      });
    const wasPublished = existing.status === "published";
    existing.set({
      ...payload,
      publishedAt:
        payload.status === "published"
          ? wasPublished
            ? existing.publishedAt ?? new Date()
            : new Date()
          : undefined,
    });
    await existing.save();
    res.json({ success: true, data: presentStory(existing) });
  } catch (error) {
    next(error);
  }
});

adminJournalRouter.delete("/:id", requireCsrf, async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id))
      return res.status(400).json({
        success: false,
        error: { message: "Choose a valid journal story." },
      });
    const story = await JournalStory.findByIdAndDelete(req.params.id);
    if (!story)
      return res.status(404).json({
        success: false,
        error: { message: "Journal story not found." },
      });
    res.json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    next(error);
  }
});

export { adminJournalRouter, journalRouter };
