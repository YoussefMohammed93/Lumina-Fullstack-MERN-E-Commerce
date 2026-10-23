import { Router } from "express";
import { Cart, Review, Wishlist } from "../models/commerce.model.js";
import { requireAuth, requireCsrf } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/cart", async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user!._id });
    res.json({ success: true, data: cart?.items ?? [] });
  } catch (error) {
    next(error);
  }
});

router.put("/cart", requireCsrf, async (req, res, next) => {
  try {
    const items = Array.isArray(req.body.items)
      ? req.body.items
          .filter(
            (
              item: unknown,
            ): item is {
              productId: string;
              variantId: string;
              quantity: number;
            } =>
              typeof item === "object" &&
              item !== null &&
              typeof (item as { productId?: unknown }).productId === "string" &&
              typeof (item as { variantId?: unknown }).variantId === "string" &&
              Number.isInteger((item as { quantity?: unknown }).quantity) &&
              (item as { quantity: number }).quantity > 0 &&
              (item as { quantity: number }).quantity <= 99,
          )
          .slice(0, 50)
      : [];

    const cart = await Cart.findOneAndUpdate(
      { userId: req.user!._id },
      { items },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    res.json({ success: true, data: cart.items });
  } catch (error) {
    next(error);
  }
});

router.get("/wishlist", async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user!._id });

    res.json({ success: true, data: wishlist?.productIds ?? [] });
  } catch (error) {
    next(error);
  }
});

router.put("/wishlist", requireCsrf, async (req, res, next) => {
  try {
    const productIds = Array.isArray(req.body.productIds)
      ? [
          ...new Set(
            (req.body.productIds as unknown[]).filter(
              (id: unknown): id is string => typeof id === "string",
            ),
          ),
        ].slice(0, 100)
      : [];

    const wishlist = await Wishlist.findOneAndUpdate(
      { userId: req.user!._id },
      { productIds },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    res.json({ success: true, data: wishlist.productIds });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/products/:productId/reviews",
  requireCsrf,
  async (req, res, next) => {
    try {
      const rating = Number(req.body.rating);
      const comment = String(req.body.comment ?? "").trim();

      if (
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5 ||
        !comment ||
        comment.length > 500
      )
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "A rating and review up to 500 characters are required.",
          },
        });

      const review = await Review.findOneAndUpdate(
        { userId: req.user!._id, productId: req.params.productId },
        { rating, comment, status: "pending" },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );
      res.status(201).json({ success: true, data: review });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
