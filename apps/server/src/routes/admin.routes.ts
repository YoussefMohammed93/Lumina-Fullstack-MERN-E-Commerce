import { Router } from "express";
import { createHash } from "node:crypto";
import { isValidObjectId } from "mongoose";
import { Category } from "../models/category.model.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import {
  requireAuth,
  requireCsrf,
  requireRole,
} from "../middleware/auth.middleware.js";
import { presentProduct } from "./product.routes.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const text = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

function invalid(body: any) {
  if (
    !text(body.name) ||
    !text(body.slug) ||
    !text(body.description) ||
    !text(body.categoryId)
  )
    return "Name, slug, description, and category are required.";
  if (!Array.isArray(body.variants) || !body.variants.length)
    return "At least one variant is required.";
  if (
    body.variants.some(
      (variant: any) =>
        !text(variant.sku) ||
        !Number.isInteger(Number(variant.price)) ||
        Number(variant.price) < 0 ||
        !Number.isInteger(Number(variant.stock)) ||
        Number(variant.stock) < 0,
    )
  )
    return "Each variant needs a SKU, whole-number piastre price, and whole-number stock.";
  return undefined;
}

function payload(body: any) {
  return {
    name: text(body.name),
    slug: slugify(text(body.slug)),
    description: text(body.description),
    brand: text(body.brand) || undefined,
    categoryId: text(body.categoryId),
    images: Array.isArray(body.images)
      ? body.images
          .filter((image: any) => text(image.url))
          .map((image: any, index: number) => ({
            url: text(image.url),
            publicId: text(image.publicId) || undefined,
            alt: text(image.alt),
            sortOrder: Number.isInteger(Number(image.sortOrder))
              ? Number(image.sortOrder)
              : index,
          }))
      : [],
    materials: text(body.materials) || undefined,
    dimensions: text(body.dimensions) || undefined,
    badge: ["new", "limited", "sale"].includes(body.badge)
      ? body.badge
      : undefined,
    cashOnDeliveryAvailable: body.cashOnDeliveryAvailable !== false,
    status: ["draft", "active", "archived"].includes(body.status)
      ? body.status
      : "draft",
    variants: body.variants.map((variant: any) => ({
      sku: text(variant.sku).toUpperCase(),
      attributes:
        variant.attributes && typeof variant.attributes === "object"
          ? variant.attributes
          : {},
      price: Number(variant.price),
      compareAtPrice:
        variant.compareAtPrice === "" || variant.compareAtPrice === undefined
          ? undefined
          : Number(variant.compareAtPrice),
      stock: Number(variant.stock),
      isActive: variant.isActive !== false,
    })),
  };
}

async function resolveCategoryId(value: unknown) {
  const categoryId = text(value);
  if (categoryId === "static-living") {
    const category = await Category.findOneAndUpdate(
      { slug: "living" },
      { $setOnInsert: { name: "Living", slug: "living", isActive: true, sortOrder: 0 } },
      { new: true, upsert: true },
    );
    return String(category._id);
  }
  const category = await Category.findById(categoryId);
  return category ? String(category._id) : undefined;
}

function categoryInput(body: any) {
  const name = text(body?.name);
  const slug = slugify(text(body?.slug) || name);
  const description = text(body?.description);
  const image = text(body?.image);
  const sortOrderText = String(body?.sortOrder ?? 0).trim();
  const sortOrder = Number(sortOrderText);
  let imageUrl: URL | undefined;

  try {
    imageUrl = new URL(image);
  } catch {
    imageUrl = undefined;
  }

  if (!name || name.length > 100)
    return { error: "Enter a category name (up to 100 characters)." };
  if (!slug || slug.length > 100)
    return { error: "Enter a valid category slug." };
  if (description.length > 500)
    return { error: "Description must be 500 characters or fewer." };
  if (
    !imageUrl ||
    image.length > 2048 ||
    !["http:", "https:"].includes(imageUrl.protocol)
  )
    return { error: "Enter a valid category image URL." };
  if (!sortOrderText)
    return { error: "Sort order must be a whole number greater than or equal to 0." };
  if (!Number.isInteger(sortOrder) || sortOrder < 0)
    return { error: "Sort order must be a whole number greater than or equal to 0." };
  if (body?.isActive !== undefined && typeof body.isActive !== "boolean")
    return { error: "Category visibility must be true or false." };

  return {
    value: {
      name,
      slug,
      description: description || undefined,
      image,
      sortOrder,
      isActive: body?.isActive ?? true,
    },
  };
}

router.get("/dashboard/overview", (_req, res) =>
  res.json({
    success: true,
    data: { message: "Admin dashboard access granted." },
  }),
);
router.post("/uploads/signature", requireCsrf, (_req, res) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret)
    return res
      .status(503)
      .json({
        success: false,
        error: { message: "Cloudinary is not configured." },
      });
  const timestamp = Math.floor(Date.now() / 1000);
  const type = _req.body?.type;
  if (type !== undefined && type !== "product" && type !== "category")
    return res.status(400).json({
      success: false,
      error: { message: "Choose a valid image upload type." },
    });
  const folder = type === "category" ? "lumina/categories" : "lumina/products";
  const signature = createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");
  res.json({
    success: true,
    data: { cloudName, apiKey, timestamp, folder, signature },
  });
});

router.get("/products", async (_req, res, next) => {
  try {
    const products = await Product.find({ trashedAt: null })
      .populate("categoryId")
      .sort({ updatedAt: -1 })
      .lean();
    res.json({ success: true, data: products.map(presentProduct) });
  } catch (error) {
    next(error);
  }
});

router.get("/products/trash", async (_req, res, next) => {
  try {
    const products = await Product.find({ trashedAt: { $ne: null } })
      .populate("categoryId")
      .sort({ trashedAt: -1 })
      .lean();
    res.json({ success: true, data: products.map(presentProduct) });
  } catch (error) {
    next(error);
  }
});

router.post("/products", requireCsrf, async (req, res, next) => {
  try {
    const message = invalid(req.body);
    if (message)
      return res.status(400).json({ success: false, error: { message } });
    const categoryId = await resolveCategoryId(req.body.categoryId);
    if (!categoryId)
      return res.status(400).json({
        success: false,
        error: { message: "Choose a valid category." },
      });
    const product = await Product.create(payload({ ...req.body, categoryId }));
    await product.populate("categoryId");
    res.status(201).json({ success: true, data: presentProduct(product) });
  } catch (error: any) {
    if (error?.code === 11000)
      return res.status(409).json({
        success: false,
        error: { message: "That slug or SKU is already in use." },
      });
    next(error);
  }
});

router.patch("/products/:id/status", requireCsrf, async (req, res, next) => {
  try {
    const status = req.body?.status;
    if (!["draft", "active", "archived"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { message: "Choose a valid product status." },
      });
    }
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, trashedAt: null },
      { $set: { status } },
      { new: true, runValidators: true },
    ).populate("categoryId");
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { message: "Product not found." },
      });
    }
    res.json({ success: true, data: presentProduct(product) });
  } catch (error) {
    next(error);
  }
});

router.patch("/products/:id", requireCsrf, async (req, res, next) => {
  try {
    const message = invalid(req.body);
    if (message)
      return res.status(400).json({ success: false, error: { message } });
    const categoryId = await resolveCategoryId(req.body.categoryId);
    if (!categoryId)
      return res.status(400).json({ success: false, error: { message: "Choose a valid category." } });
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, trashedAt: null },
      payload({ ...req.body, categoryId }),
      { new: true, runValidators: true },
    ).populate("categoryId");
    if (!product)
      return res
        .status(404)
        .json({ success: false, error: { message: "Product not found." } });
    res.json({ success: true, data: presentProduct(product) });
  } catch (error: any) {
    if (error?.code === 11000)
      return res.status(409).json({
        success: false,
        error: { message: "That slug or SKU is already in use." },
      });
    next(error);
  }
});

router.delete("/products/:id", requireCsrf, async (req, res, next) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, trashedAt: null },
      { $set: { trashedAt: new Date() } },
      { new: true },
    ).populate("categoryId");
    if (!product)
      return res
        .status(404)
        .json({ success: false, error: { message: "Product not found." } });
    res.json({ success: true, data: presentProduct(product) });
  } catch (error) {
    next(error);
  }
});

router.patch("/products/:id/restore", requireCsrf, async (req, res, next) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, trashedAt: { $ne: null } },
      { $unset: { trashedAt: 1 } },
      { new: true, runValidators: true },
    ).populate("categoryId");
    if (!product)
      return res.status(404).json({
        success: false,
        error: { message: "Trashed product not found." },
      });
    res.json({ success: true, data: presentProduct(product) });
  } catch (error) {
    next(error);
  }
});

router.delete(
  "/products/:id/permanent",
  requireCsrf,
  async (req, res, next) => {
    try {
      const product = await Product.findOneAndDelete({
        _id: req.params.id,
        trashedAt: { $ne: null },
      });
      if (!product)
        return res.status(404).json({
          success: false,
          error: { message: "Trashed product not found." },
        });
      res.json({ success: true, data: { id: String(product._id) } });
    } catch (error) {
      next(error);
    }
  },
);

router.patch("/products/:id/unarchive", requireCsrf, async (req, res, next) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, status: "archived", trashedAt: null },
      { $set: { status: "active" } },
      { new: true, runValidators: true },
    ).populate("categoryId");
    if (!product)
      return res.status(404).json({
        success: false,
        error: { message: "Archived product not found." },
      });
    res.json({ success: true, data: presentProduct(product) });
  } catch (error) {
    next(error);
  }
});

router.get("/categories", async (_req, res, next) => {
  try {
    const categories = await Category.find()
      .sort({ sortOrder: 1, name: 1 })
      .lean();
    res.json({
      success: true,
      data: categories.map((category) => ({
        ...category,
        id: String(category._id),
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/categories", requireCsrf, async (req, res, next) => {
  try {
    const parsed = categoryInput(req.body);
    if ("error" in parsed)
      return res.status(400).json({
        success: false,
        error: { message: parsed.error },
      });
    const category = await Category.create(parsed.value);
    res.status(201).json({
      success: true,
      data: { ...category.toObject(), id: String(category._id) },
    });
  } catch (error: any) {
    if (error?.code === 11000)
      return res.status(409).json({
        success: false,
        error: { message: "A category with that slug already exists." },
      });
    next(error);
  }
});

router.patch("/categories/:id", requireCsrf, async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id))
      return res.status(400).json({
        success: false,
        error: { message: "Choose a valid category." },
      });
    const parsed = categoryInput(req.body);
    if ("error" in parsed)
      return res.status(400).json({
        success: false,
        error: { message: parsed.error },
      });
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: parsed.value },
      { new: true, runValidators: true },
    ).lean();
    if (!category)
      return res.status(404).json({
        success: false,
        error: { message: "Category not found." },
      });
    res.json({
      success: true,
      data: { ...category, id: String(category._id) },
    });
  } catch (error: any) {
    if (error?.code === 11000)
      return res.status(409).json({
        success: false,
        error: { message: "A category with that slug already exists." },
      });
    next(error);
  }
});

router.delete("/categories/:id", requireCsrf, async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id))
      return res.status(400).json({
        success: false,
        error: { message: "Choose a valid category." },
      });
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({
        success: false,
        error: { message: "Category not found." },
      });
    const productCount = await Product.countDocuments({
      categoryId: category._id,
    });
    if (productCount > 0)
      return res.status(409).json({
        success: false,
        error: {
          message: `This category is assigned to ${productCount} product${productCount === 1 ? "" : "s"}. Reassign them before deleting it.`,
        },
      });
    await category.deleteOne();
    res.json({ success: true, data: { id: String(category._id) } });
  } catch (error) {
    next(error);
  }
});

// ── Customer management ────────────────────────────────────────────────

router.get("/customers", async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();

    // Aggregate order counts and totals per user in a single query
    const orderStats = await Order.aggregate([
      {
        $group: {
          _id: "$userId",
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$amountTotal" },
        },
      },
    ]);
    const statsMap = new Map(
      orderStats.map((s) => [String(s._id), s]),
    );

    // Compute stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    let active = 0;
    let disabled = 0;
    let newThisMonth = 0;

    const customers = users.map((user) => {
      if (user.status === "disabled") disabled++;
      else active++;

      const created = new Date((user as any).createdAt);
      if (created >= startOfMonth) newThisMonth++;

      const stats = statsMap.get(String(user._id));
      return {
        id: String(user._id),
        username: user.username,
        name: user.name || undefined,
        email: user.email,
        avatarUrl: user.avatarUrl || undefined,
        role: user.role,
        status: user.status,
        createdAt: (user as any).createdAt,
        orderCount: stats?.orderCount ?? 0,
        totalSpent: stats?.totalSpent ?? 0,
      };
    });

    res.json({
      success: true,
      data: {
        customers,
        stats: {
          total: users.length,
          active,
          disabled,
          newThisMonth,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/customers/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user)
      return res
        .status(404)
        .json({ success: false, error: { message: "Customer not found." } });

    const orders = await Order.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const orderCount = await Order.countDocuments({ userId: user._id });
    const totalSpentAgg = await Order.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: null, total: { $sum: "$amountTotal" } } },
    ]);
    const totalSpent = totalSpentAgg[0]?.total ?? 0;

    res.json({
      success: true,
      data: {
        customer: {
          id: String(user._id),
          username: user.username,
          name: user.name || undefined,
          email: user.email,
          avatarUrl: user.avatarUrl || undefined,
          role: user.role,
          status: user.status,
          createdAt: (user as any).createdAt,
          orderCount,
          totalSpent,
        },
        orders: orders.map((order) => ({
          id: String(order._id),
          items: order.items,
          amountTotal: order.amountTotal,
          currency: order.currency,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          fulfillmentStatus: order.fulfillmentStatus,
          createdAt: (order as any).createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/customers/:id/status", requireCsrf, async (req, res, next) => {
  try {
    const status = req.body?.status;
    if (!["active", "disabled"].includes(status))
      return res.status(400).json({
        success: false,
        error: { message: "Status must be 'active' or 'disabled'." },
      });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true, runValidators: true },
    ).lean();

    if (!user)
      return res
        .status(404)
        .json({ success: false, error: { message: "Customer not found." } });

    res.json({
      success: true,
      data: {
        id: String(user._id),
        username: user.username,
        name: user.name || undefined,
        email: user.email,
        avatarUrl: user.avatarUrl || undefined,
        role: user.role,
        status: user.status,
        createdAt: (user as any).createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
