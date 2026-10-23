export type ProductBadge = "new" | "limited" | "sale";
export type ProductStatus = "draft" | "active" | "archived";

export interface ProductImage {
  url: string;
  publicId?: string;
  alt: string;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  attributes: Record<string, string>;
  price: number;
  compareAtPrice?: number;
  stock: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand?: string;
  category: string;
  categoryId?: string;
  categorySlug?: string;
  images: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  price: number;
  priceMax?: number;
  compareAtPrice?: number;
  badge?: ProductBadge;
  materials?: string;
  dimensions?: string;
  cashOnDeliveryAvailable?: boolean;
  status?: ProductStatus;
  trashedAt?: string;
  variants?: ProductVariant[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface Collection {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  image: string;
  href: string;
  span: "wide" | "tall" | "standard";
}

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  location: string;
  rating: number;
  avatar?: string;
}

export interface CartLine {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface ProductsApiResponse {
  success: boolean;
  data: { items: Product[]; page: number; pageCount: number; total: number };
}
