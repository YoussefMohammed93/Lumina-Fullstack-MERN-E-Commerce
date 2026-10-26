import { Router } from "express";
import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";

const router = Router();

const id = (value: unknown) => String(value);

export function presentProduct(product: any) {
  const item = product.toObject ? product.toObject() : product;
  const category =
    item.categoryId && typeof item.categoryId === "object"
      ? item.categoryId
      : undefined;
  const variants = (item.variants ?? []).map((variant: any) => ({
    ...variant,
    id: id(variant._id),
  }));
  const active = variants.filter((variant: any) => variant.isActive);
  const prices = active.map((variant: any) => variant.price);
  const lowestPriceVariant = active.reduce(
    (lowest: any, variant: any) =>
      !lowest || variant.price < lowest.price ? variant : lowest,
    undefined,
  );
  return {
    id: id(item._id),
    name: item.name,
    slug: item.slug,
    description: item.description,
    brand: item.brand,
    category: category?.name ?? "Uncategorized",
    categorySlug: category?.slug,
    categoryId: id(category?._id ?? item.categoryId),
    images: item.images ?? [],
    materials: item.materials,
    dimensions: item.dimensions,
    badge: item.badge,
    cashOnDeliveryAvailable: item.cashOnDeliveryAvailable,
    status: item.status,
    trashedAt: item.trashedAt,
    rating: item.averageRating,
    reviewCount: item.reviewCount,
    price: prices.length ? Math.min(...prices) : 0,
    priceMax: prices.length ? Math.max(...prices) : 0,
    compareAtPrice: lowestPriceVariant?.compareAtPrice,
    stock: active.reduce((sum: number, variant: any) => sum + variant.stock, 0),
    variants,
  };
}

router.get("/categories", async (_req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();
    const categoriesWithoutImages = categories
      .filter((category) => !category.image)
      .map((category) => category._id);
    const fallbackProducts = categoriesWithoutImages.length
      ? await Product.find({
          categoryId: { $in: categoriesWithoutImages },
          status: "active",
          trashedAt: null,
        })
          .select("categoryId images")
          .sort({ createdAt: 1 })
          .lean()
      : [];
    const fallbackImages = new Map<string, string>();
    for (const product of fallbackProducts) {
      const firstImage = product.images?.[0];
      const imageUrl =
        typeof firstImage === "string" ? firstImage : firstImage?.url;
      if (imageUrl && !fallbackImages.has(String(product.categoryId)))
        fallbackImages.set(String(product.categoryId), imageUrl);
    }
    res.json({
      success: true,
      data: categories.map((category) => ({
        ...category,
        id: id(category._id),
        image: category.image ?? fallbackImages.get(String(category._id)),
        description:
          category.description ??
          `Explore thoughtfully selected pieces for ${category.name.toLowerCase()}.`,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/products", async (req, res, next) => {
  try {
    const filter: Record<string, unknown> = {
      status: "active",
      trashedAt: null,
    };
    const categorySlug =
      typeof req.query.category === "string" ? req.query.category : "";
    if (categorySlug) {
      const category = await Category.findOne({
        slug: categorySlug,
        isActive: true,
      }).lean();
      if (!category)
        return res.json({
          success: true,
          data: { items: [], page: 1, pageCount: 0, total: 0 },
        });
      filter.categoryId = category._id;
    }
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (q) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: new RegExp(safe, "i") },
        { description: new RegExp(safe, "i") },
      ];
    }
    const raw = await Product.find(filter).populate("categoryId").lean();
    const minPrice = Number(req.query.minPrice);
    const maxPrice = Number(req.query.maxPrice);
    const minRating = Number(req.query.minRating);
    let items = raw
      .map(presentProduct)
      .filter(
        (item) =>
          (!Number.isFinite(minPrice) || item.price >= minPrice) &&
          (!Number.isFinite(maxPrice) || item.price <= maxPrice) &&
          (!Number.isFinite(minRating) ||
            minRating <= 0 ||
            item.rating >= minRating) &&
          (req.query.availability !== "in-stock" || item.stock > 0) &&
          (req.query.availability !== "out-of-stock" || item.stock === 0),
      );
    if (req.query.sort === "price_asc") items.sort((a, b) => a.price - b.price);
    else if (req.query.sort === "price_desc")
      items.sort((a, b) => b.price - a.price);
    else if (req.query.sort === "rating_desc")
      items.sort((a, b) => b.rating - a.rating);
    else if (req.query.sort === "name_asc")
      items.sort((a, b) => a.name.localeCompare(b.name));
    const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 48));
    const requestedPage = Math.max(1, Number(req.query.page) || 1);
    const total = items.length;
    const pageCount = Math.ceil(total / limit);
    const page = Math.min(requestedPage, Math.max(pageCount, 1));
    res.json({
      success: true,
      data: {
        items: items.slice((page - 1) * limit, page * limit),
        page,
        pageCount,
        total,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/products/:slug", async (req, res, next) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      status: "active",
      trashedAt: null,
    })
      .populate("categoryId")
      .lean();
    if (!product)
      return res
        .status(404)
        .json({ success: false, error: { message: "Product not found." } });
    res.json({ success: true, data: presentProduct(product) });
  } catch (error) {
    next(error);
  }
});

export default router;
