import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/types/product";

const STORAGE_KEY = "lumina.cart.v1";

/** Cart lines are kept minimal here (id + qty); the server will own truth later. */
interface StoredCart {
  lines: { productId: string; quantity: number }[];
  wishlist: string[];
}

interface CartContextValue {
  lines: StoredCart["lines"];
  lineCount: number;
  totalQuantity: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  wishlist: Set<string>;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

function readStorage(): StoredCart {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lines: [], wishlist: [] };
    const parsed = JSON.parse(raw) as Partial<StoredCart>;
    return {
      lines: Array.isArray(parsed.lines) ? parsed.lines : [],
      wishlist: Array.isArray(parsed.wishlist) ? parsed.wishlist : [],
    };
  } catch {
    return { lines: [], wishlist: [] };
  }
}

export function CartProvider({
  products,
  children,
}: {
  products: Product[];
  children: ReactNode;
}) {
  const [state, setState] = useState<StoredCart>(() =>
    typeof window === "undefined" ? { lines: [], wishlist: [] } : readStorage(),
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage can be unavailable (private mode); the cart still works in memory.
    }
  }, [state]);

  const addItem = useCallback((product: Product, quantity = 1) => {
    setState((current) => {
      const existing = current.lines.find((line) => line.productId === product.id);
      const lines = existing
        ? current.lines.map((line) =>
            line.productId === product.id
              ? {
                  ...line,
                  quantity: Math.min(line.quantity + quantity, Math.max(product.stock, 1)),
                }
              : line,
          )
        : [...current.lines, { productId: product.id, quantity }];
      return { ...current, lines };
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setState((current) => ({
      ...current,
      lines: current.lines.filter((line) => line.productId !== productId),
    }));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setState((current) => ({
      ...current,
      lines:
        quantity <= 0
          ? current.lines.filter((line) => line.productId !== productId)
          : current.lines.map((line) =>
              line.productId === productId ? { ...line, quantity } : line,
            ),
    }));
  }, []);

  const clearCart = useCallback(() => {
    setState((current) => ({ ...current, lines: [] }));
  }, []);

  const toggleWishlist = useCallback((productId: string) => {
    let added = false;
    setState((current) => {
      const has = current.wishlist.includes(productId);
      added = !has;
      return {
        ...current,
        wishlist: has
          ? current.wishlist.filter((id) => id !== productId)
          : [...current.wishlist, productId],
      };
    });
    return added;
  }, []);

  const { subtotal, totalQuantity } = useMemo(() => {
    let sum = 0;
    let count = 0;
    for (const line of state.lines) {
      const product = products.find((item) => item.id === line.productId);
      if (!product) continue;
      sum += product.price * line.quantity;
      count += line.quantity;
    }
    return { subtotal: sum, totalQuantity: count };
  }, [products, state.lines]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines: state.lines,
      lineCount: state.lines.length,
      totalQuantity,
      subtotal,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
      wishlist: new Set(state.wishlist),
      isWishlisted: (productId) => state.wishlist.includes(productId),
      toggleWishlist,
    }),
    [
      addItem,
      clearCart,
      removeItem,
      setQuantity,
      state.lines,
      state.wishlist,
      subtotal,
      toggleWishlist,
      totalQuantity,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
}
