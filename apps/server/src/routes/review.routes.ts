import { isValidObjectId } from "mongoose";
import { Router } from "express";
import { requireAuth, requireCsrf, requireRole } from "../middleware/auth.middleware.js";
import { Product } from "../models/product.model.js";
import { Review } from "../models/commerce.model.js";
import { User } from "../models/user.model.js";

export const publicReviewRouter = Router();
export const adminReviewRouter = Router();

adminReviewRouter.use(requireAuth, requireRole("admin"));

function positiveInteger(value: unknown, fallback: number, max: number) {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return fallback;
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0
    ? Math.min(number, max)
    : fallback;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function refreshProductReviewStats(productId: string) {
  const [stats] = await Review.aggregate<{
    averageRating: number;
    reviewCount: number;
  }>([
    { $match: { productId, status: "published" } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);
  await Product.updateOne(
    { _id: productId },
    {
      $set: {
        averageRating: stats ? Math.round(stats.averageRating * 10) / 10 : 0,
        reviewCount: stats?.reviewCount ?? 0,
      },
    },
  );
}

publicReviewRouter.get("/products/:productId/reviews", async (req, res, next) => {
  try {
    const productId = req.params.productId;
    if (typeof productId !== "string" || !isValidObjectId(productId))
      return res.status(400).json({
        success: false,
        error: { message: "Choose a valid product." },
      });
    const productExists = await Product.exists({
      _id: productId,
      status: "active",
      trashedAt: null,
    });
    if (!productExists)
      return res.status(404).json({
        success: false,
        error: { message: "Product not found." },
      });

    const page = positiveInteger(req.query.page, 1, Number.MAX_SAFE_INTEGER);
    const limit = positiveInteger(req.query.limit, 2, 20);
    const filter = { productId, status: "published" as const };
    const [reviews, total, stats] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
      Review.aggregate<{ averageRating: number }>([
        { $match: filter },
        { $group: { _id: null, averageRating: { $avg: "$rating" } } },
      ]),
    ]);
    const users = await User.find({
      _id: { $in: reviews.map((review) => review.userId) },
    })
      .select("name username avatarUrl")
      .lean();
    const usersById = new Map(users.map((user) => [String(user._id), user]));

    res.json({
      success: true,
      data: {
        reviews: reviews.map((review) => {
          const user = usersById.get(String(review.userId));
          return {
            id: String(review._id),
            name: user?.name || user?.username || "Customer",
            avatarUrl: user?.avatarUrl ?? "",
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
          };
        }),
        total,
        averageRating: stats[0]
          ? Math.round(stats[0].averageRating * 10) / 10
          : 0,
        pagination: {
          page,
          limit,
          pageCount: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

adminReviewRouter.get("/", async (req, res, next) => {
  try {
    const page = positiveInteger(req.query.page, 1, Number.MAX_SAFE_INTEGER);
    const limit = positiveInteger(req.query.limit, 10, 50);
    const status =
      typeof req.query.status === "string" ? req.query.status : "pending";
    if (!["pending", "published", "rejected", "all"].includes(status))
      return res.status(400).json({
        success: false,
        error: { message: "Choose a valid review status." },
      });

    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    const filter: Record<string, unknown> = {};
    if (status !== "all") filter.status = status;
    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      const [matchingUsers, matchingProducts] = await Promise.all([
        User.find({
          $or: [
            { name: regex },
            { username: regex },
            { email: regex },
          ],
        })
          .select("_id")
          .lean(),
        Product.find({ name: regex }).select("_id").lean(),
      ]);
      filter.$or = [
        { comment: regex },
        { productId: { $in: matchingProducts.map((product) => String(product._id)) } },
        { userId: { $in: matchingUsers.map((user) => user._id) } },
      ];
    }
    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);
    const [users, products] = await Promise.all([
      User.find({ _id: { $in: reviews.map((review) => review.userId) } })
        .select("name username email avatarUrl")
        .lean(),
      Product.find({
        _id: {
          $in: reviews
            .map((review) => review.productId)
            .filter((productId) => isValidObjectId(productId)),
        },
      })
        .select("name slug images")
        .lean(),
    ]);
    const usersById = new Map(users.map((user) => [String(user._id), user]));
    const productsById = new Map(
      products.map((product) => [String(product._id), product]),
    );

    res.json({
      success: true,
      data: {
        reviews: reviews.map((review) => {
          const user = usersById.get(String(review.userId));
          const product = productsById.get(review.productId);
          return {
            id: String(review._id),
            productId: review.productId,
            productName: product?.name ?? "Unknown product",
            productSlug: product?.slug ?? "",
            productImage: product?.images?.[0]?.url ?? "",
            customerName: user?.name || user?.username || "Customer",
            customerEmail: user?.email ?? "",
            avatarUrl: user?.avatarUrl ?? "",
            rating: review.rating,
            comment: review.comment,
            status: review.status,
            createdAt: review.createdAt,
          };
        }),
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

adminReviewRouter.patch("/:id/status", requireCsrf, async (req, res, next) => {
  try {
    const { id } = req.params;
    const status = req.body?.status;
    if (
      typeof id !== "string" ||
      !isValidObjectId(id) ||
      !["published", "rejected"].includes(status)
    )
      return res.status(400).json({
        success: false,
        error: { message: "Choose a valid review action." },
      });

    const review = await Review.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true },
    );
    if (!review)
      return res.status(404).json({
        success: false,
        error: { message: "Review not found." },
      });
    await refreshProductReviewStats(review.productId);
    res.json({ success: true, data: { id, status: review.status } });
  } catch (error) {
    next(error);
  }
});
