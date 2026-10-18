import type {
  Collection,
  ProductsApiResponse,
  Product,
  Testimonial,
} from "../types/product";
import { collections, products, testimonials } from "../data/products";

/**
 * Single seam between the UI and its data source.
 *
 * Today every function resolves from `src/data`. When the Express API lands,
 * replace the body of each function with a fetch against
 * `http://localhost:5000/api/v1/...` (or the Vite-proxied `/api/v1/...`)
 * and keep the return types — no component needs to change.
 */

const delay = (ms = 260) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchProducts(): Promise<Product[]> {
  await delay();
  return products;
}

/** Kept for the eventual real `GET /api/v1/products` response envelope. */
export type { ProductsApiResponse };

export async function fetchCollections(): Promise<Collection[]> {
  await delay(120);
  return collections;
}

export async function fetchTestimonials(): Promise<Testimonial[]> {
  await delay(120);
  return testimonials;
}

export function formatPrice(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}
