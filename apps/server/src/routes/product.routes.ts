import { Router, Request, Response } from "express";
import { products } from "../data/products.js";

const router = Router();

const getProducts = (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    data: products,
  });
};

// Responds to GET / when mounted at /api/v1/products, or GET /products when mounted at /api/v1
router.get("/", getProducts);
router.get("/products", getProducts);

export default router;
