import { Router } from "express";
import { NewsletterSubscriber } from "../models/newsletter-subscriber.model.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { authRateLimit } from "../middleware/rate-limit.middleware.js";

const router = Router();

function isValidEmail(value: string) {
  if (value.length > 254) return false;
  const parts = value.split("@");
  if (parts.length !== 2) return false;
  const [localPart, domain] = parts;
  if (
    !localPart ||
    localPart.length > 64 ||
    localPart.startsWith(".") ||
    localPart.endsWith(".") ||
    localPart.includes("..") ||
    !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(localPart) ||
    domain.length > 253
  )
    return false;

  const labels = domain.split(".");
  return (
    labels.length >= 2 &&
    labels.every(
      (label) =>
        label.length > 0 &&
        label.length <= 63 &&
        /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label),
    ) &&
    /^[A-Za-z]{2,}$/.test(labels.at(-1) ?? "")
  );
}

function positiveInteger(value: unknown, fallback: number, max: number) {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0
    ? Math.min(parsed, max)
    : fallback;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

router.post("/", authRateLimit, async (req, res, next) => {
  try {
    const rawEmail = typeof req.body?.email === "string" ? req.body.email : "";
    const email = rawEmail.trim().toLowerCase();
    if (!isValidEmail(email))
      return res.status(400).json({
        success: false,
        error: {
          message:
            "Enter a valid email address with a correctly formatted name and domain.",
        },
      });

    try {
      await NewsletterSubscriber.create({ email });
      return res.status(201).json({
        success: true,
        data: { subscribed: true, alreadySubscribed: false },
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
      )
        return res.json({
          success: true,
          data: { subscribed: true, alreadySubscribed: true },
        });
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

router.get(
  "/subscribers",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const page = positiveInteger(req.query.page, 1, Number.MAX_SAFE_INTEGER);
      const limit = positiveInteger(req.query.limit, 20, 100);
      const search =
        typeof req.query.search === "string" ? req.query.search.trim() : "";
      const filter = search
        ? { email: { $regex: escapeRegex(search), $options: "i" } }
        : {};
      const [subscribers, total, subscriberCount] = await Promise.all([
        NewsletterSubscriber.find(filter)
          .sort({ createdAt: -1, _id: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .select({ email: 1, createdAt: 1 })
          .lean(),
        NewsletterSubscriber.countDocuments(filter),
        NewsletterSubscriber.countDocuments(),
      ]);

      res.json({
        success: true,
        data: {
          subscribers: subscribers.map((subscriber) => ({
            id: String(subscriber._id),
            email: subscriber.email,
            subscribedAt: subscriber.createdAt,
          })),
          subscriberCount,
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
  },
);

export default router;
