import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "./config/db.js";
import { Category } from "./models/category.model.js";
import { Product } from "./models/product.model.js";
import { collections, products } from "../../client/src/data/products.ts";

async function seed() {
  await connectDB();
  const categoryNames = [
    ...new Set(products.map((product) => product.category)),
  ];
  const categories = new Map<string, string>();
  for (const [index, name] of categoryNames.entries()) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const collection = collections.find(
      (item) => item.eyebrow.split("·").at(-1)?.trim() === name,
    );
    const firstProduct = products.find((item) => item.category === name);
    const category = await Category.findOneAndUpdate(
      { slug },
      {
        name,
        slug,
        description:
          collection?.description ??
          `Explore thoughtfully selected pieces for ${name.toLowerCase()}.`,
        image: collection?.image ?? firstProduct?.images[0],
        isActive: true,
        sortOrder: index,
      },
      { upsert: true, new: true },
    );
    categories.set(name, String(category._id));
  }
  for (const item of products) {
    await Product.findOneAndUpdate(
      { slug: item.slug },
      {
        name: item.name,
        slug: item.slug,
        description: item.description,
        categoryId: categories.get(item.category),
        images: item.images.map((url, sortOrder) => ({
          url,
          alt: item.name,
          sortOrder,
        })),
        materials: item.materials,
        dimensions: item.dimensions,
        badge: item.badge,
        cashOnDeliveryAvailable: item.cashOnDeliveryAvailable !== false,
        status: "active",
        averageRating: item.rating,
        reviewCount: item.reviewCount,
        variants: [
          {
            sku: `${item.slug}-DEFAULT`.toUpperCase(),
            attributes: {},
            price: Math.round(item.price * 100),
            compareAtPrice: item.compareAtPrice
              ? Math.round(item.compareAtPrice * 100)
              : undefined,
            stock: item.stock,
            isActive: true,
          },
        ],
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }
  console.log(`Seeded ${products.length} products.`);
  process.exit(0);
}

void seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
