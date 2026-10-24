import type {
  Category,
  ProductsApiResponse,
  Product,
  Testimonial,
} from "../types/product";
import { testimonials } from "../data/products";

type Envelope<T> = { success: boolean; data?: T; error?: { message?: string } };

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`/api/v1${path}`);
  const body = (await response.json().catch(() => ({}))) as Envelope<T>;

  if (!response.ok || !body.success)
    throw new Error(body.error?.message ?? "Unable to load catalog.");

  return body.data as T;
}

export async function fetchProducts(): Promise<Product[]> {
  const result =
    await request<ProductsApiResponse["data"]>("/products?limit=48");

  return result.items.map((item) => ({
    ...item,
    images: item.images.map((image) =>
      imageUrl(image as unknown as string | { url: string }),
    ),
  }));
}

export function getProductBySlug(
  slug: string,
  source: Product[],
): Product | undefined {
  return source.find((product) => product.slug === slug);
}

export type { ProductsApiResponse };

export async function fetchCategories(): Promise<Category[]> {
  return request<Category[]>("/categories");
}

export async function fetchTestimonials(): Promise<Testimonial[]> {
  return testimonials;
}

export function formatPrice(value: number, currency = "EGP"): string {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value / 100);
}
export function imageUrl(image: string | { url: string }): string {
  return typeof image === "string" ? image : image.url;
}
