export type ProductBadge = "new" | "limited" | "sale";

export interface Product {
  /** Stable identifier — maps to MongoDB `_id` once the API is wired. */
  id: string;
  name: string;
  slug: string;
  description: string;
  /** Price in major EGP units, formatted at the edge. */
  price: number;
  compareAtPrice?: number;
  category: string;
  images: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  badge?: ProductBadge;
  materials: string;
  dimensions?: string;
  /** Defaults to enabled while mock catalogues are being migrated. */
  cashOnDeliveryAvailable?: boolean;
}

export interface Collection {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  image: string;
  href: string;
  /** Grid span used by the bento layout on desktop. */
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
  quantity: number;
}

export interface ProductsApiResponse {
  success: boolean;
  data: Product[];
}
