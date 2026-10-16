import { Router } from "express";
import { Product } from "../models/product.model.js";

const router = Router();

router.get("/products", async (_req, res, next) => {
  try {
    const products = await Product.find().select("-__v").lean();

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
