import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/types/product";
import { authenticatedRequest } from "@/features/auth/auth-client";
import { useAuth } from "@/features/auth/useAuth";
import { CartContext, type CartContextValue } from "./cart-context";

interface StoredCart {
  lines: { productId: string; quantity: number }[];
  wishlist: string[];
}

export function CartProvider({
  products,
  children,
}: {
  products: Product[];
  children: ReactNode;
}) {
  const { user, csrfToken, openAuth } = useAuth();
  const [hydratedUserId, setHydratedUserId] = useState<string | null>(null);
  const [state, setState] = useState<StoredCart>({ lines: [], wishlist: [] });

  useEffect(() => {
    if (!user) {
      return;
    }
    let cancelled = false;
    Promise.all([
      fetch("/api/v1/cart", { credentials: "include" }).then((response) =>
        response.json(),
      ) as Promise<{ data?: StoredCart["lines"] }>,
      fetch("/api/v1/wishlist", { credentials: "include" }).then((response) =>
        response.json(),
      ) as Promise<{ data?: string[] }>,
    ])
      .then(([cart, wishlist]) => {
        if (cancelled) return;
        setState({
          lines: Array.isArray(cart.data) ? cart.data : [],
          wishlist: Array.isArray(wishlist.data) ? wishlist.data : [],
        });
        setHydratedUserId(user.id);
      })
      .catch(() => {
        if (!cancelled) setHydratedUserId(user.id);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !csrfToken || hydratedUserId !== user.id) return;
    void authenticatedRequest("/cart", csrfToken, {
      method: "PUT",
      body: JSON.stringify({ items: state.lines }),
    }).catch(() => undefined);
    void authenticatedRequest("/wishlist", csrfToken, {
      method: "PUT",
      body: JSON.stringify({ productIds: state.wishlist }),
    }).catch(() => undefined);
  }, [csrfToken, hydratedUserId, state.lines, state.wishlist, user]);

  const addItem = useCallback(
    (product: Product, quantity = 1) => {
      if (!user) {
        openAuth();
        return false;
      }
      setState((current) => {
        const existing = current.lines.find(
          (line) => line.productId === product.id,
        );
        const lines = existing
          ? current.lines.map((line) =>
              line.productId === product.id
                ? {
                    ...line,
                    quantity: Math.min(
                      line.quantity + quantity,
                      Math.max(product.stock, 1),
                    ),
                  }
                : line,
            )
          : [...current.lines, { productId: product.id, quantity }];
        return { ...current, lines };
      });
      return true;
    },
    [openAuth, user],
  );

  const removeItem = useCallback(
    (productId: string) => {
      if (!user) {
        openAuth();
        return;
      }
      setState((current) => ({
        ...current,
        lines: current.lines.filter((line) => line.productId !== productId),
      }));
    },
    [openAuth, user],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (!user) {
        openAuth();
        return;
      }
      setState((current) => ({
        ...current,
        lines:
          quantity <= 0
            ? current.lines.filter((line) => line.productId !== productId)
            : current.lines.map((line) =>
                line.productId === productId ? { ...line, quantity } : line,
              ),
      }));
    },
    [openAuth, user],
  );

  const clearCart = useCallback(() => {
    if (!user) {
      openAuth();
      return;
    }
    setState((current) => ({ ...current, lines: [] }));
  }, [openAuth, user]);

  const toggleWishlist = useCallback(
    (productId: string) => {
      if (!user) {
        openAuth();
        return false;
      }
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
    },
    [openAuth, user],
  );

  // Never expose a previous account's state while signed out or switching users.
  const visibleState = user && hydratedUserId === user.id
    ? state
    : { lines: [], wishlist: [] };

  const { subtotal, totalQuantity } = useMemo(() => {
    let sum = 0;
    let count = 0;
    for (const line of visibleState.lines) {
      const product = products.find((item) => item.id === line.productId);
      if (!product) continue;
      sum += product.price * line.quantity;
      count += line.quantity;
    }
    return { subtotal: sum, totalQuantity: count };
  }, [products, visibleState.lines]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines: visibleState.lines,
      lineCount: visibleState.lines.length,
      totalQuantity,
      subtotal,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
      wishlist: new Set(visibleState.wishlist),
      isWishlisted: (productId) => visibleState.wishlist.includes(productId),
      toggleWishlist,
    }),
    [
      addItem,
      clearCart,
      removeItem,
      setQuantity,
      visibleState.lines,
      visibleState.wishlist,
      subtotal,
      toggleWishlist,
      totalQuantity,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
