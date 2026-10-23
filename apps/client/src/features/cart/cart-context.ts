import { createContext } from "react";
import type { Product } from "@/types/product";

export interface CartContextValue {
  lines: { productId: string; variantId: string; quantity: number }[];
  lineCount: number;
  totalQuantity: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number, variantId?: string) => boolean;
  removeItem: (productId: string, variantId: string) => void;
  setQuantity: (productId: string, variantId: string, quantity: number) => void;
  setVariant: (
    productId: string,
    currentVariantId: string,
    nextVariantId: string,
  ) => void;
  clearCart: () => Promise<void>;
  wishlist: Set<string>;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => boolean;
}

export const CartContext = createContext<CartContextValue | null>(null);
