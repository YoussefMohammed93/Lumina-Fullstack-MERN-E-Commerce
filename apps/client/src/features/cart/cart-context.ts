import { createContext } from "react";
import type { Product } from "@/types/product";

export interface CartContextValue {
  lines: { productId: string; quantity: number }[];
  lineCount: number;
  totalQuantity: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number) => boolean;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  wishlist: Set<string>;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => boolean;
}

export const CartContext = createContext<CartContextValue | null>(null);
