import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import type { Product } from "@/types/product";
import { formatPrice } from "@/services/api";
import { SafeImage } from "@/components/motion/SafeImage";
import { ArrowButton } from "@/components/ArrowButton";
import { Drawer } from "@/components/Drawer";
import { useCart } from "@/features/cart/CartProvider";

const FREE_SHIPPING_THRESHOLD = 150;

export function CartDrawer({
  open,
  onClose,
  products,
}: {
  open: boolean;
  onClose: () => void;
  products: Product[];
}) {
  const { lines, subtotal, totalQuantity, setQuantity, removeItem } = useCart();

  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);
  const progress = Math.min(subtotal / FREE_SHIPPING_THRESHOLD, 1);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      eyebrow="Your bag"
      title={totalQuantity === 1 ? "1 item" : `${totalQuantity} items`}
      footer={
        lines.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular font-medium">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-[11px] leading-5 text-muted-foreground">
              Shipping and taxes are calculated at checkout. Complimentary
              shipping over {formatPrice(FREE_SHIPPING_THRESHOLD)}.
            </p>
            <ArrowButton className="w-full justify-between" disabled>
              Proceed to checkout
            </ArrowButton>
            <p className="text-center text-[10px] text-muted-foreground/80">
              Checkout arrives in the next phase — this bag is saved locally.
            </p>
          </div>
        ) : undefined
      }
    >
      {lines.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-5 py-20 text-center">
          <span className="flex size-14 items-center justify-center rounded-full border border-border/80">
            <ShoppingBag className="size-5 text-muted-foreground" strokeWidth={1} />
          </span>
          <div className="space-y-2">
            <p className="font-serif text-2xl">Your bag is quiet</p>
            <p className="max-w-[24ch] text-[13px] leading-6 text-muted-foreground">
              Nothing here yet. The collection is a good place to begin.
            </p>
          </div>
          <a
            href="#featured"
            onClick={onClose}
            className="eyebrow border-b border-foreground/30 pb-1 text-foreground transition-colors duration-300 hover:border-clay hover:text-clay"
          >
            Browse the collection
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-px w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-clay transition-[width] duration-700 ease-luxe"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {remaining === 0
                ? "Complimentary shipping unlocked."
                : `${formatPrice(remaining)} away from complimentary shipping.`}
            </p>
          </div>

          <ul className="divide-y divide-border/70">
            {lines.map((line) => {
              const product = products.find((item) => item.id === line.productId);
              if (!product) return null;

              return (
                <li key={line.productId} className="flex gap-4 py-5 first:pt-0">
                  <div className="size-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                    <SafeImage src={product.images[0]} alt={product.name} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="eyebrow text-muted-foreground">
                          {product.category}
                        </p>
                        <p className="mt-1 font-serif text-lg leading-tight">
                          {product.name}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(product.id)}
                        aria-label={`Remove ${product.name}`}
                        className="p-1 text-muted-foreground transition-colors duration-300 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" strokeWidth={1.25} />
                      </button>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                      <div className="flex items-center rounded-full border border-border/80">
                        <button
                          type="button"
                          onClick={() => setQuantity(product.id, line.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <Minus className="size-3" strokeWidth={1.5} />
                        </button>
                        <span className="tabular w-6 text-center text-[12px]">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(product.id, line.quantity + 1)}
                          aria-label="Increase quantity"
                          className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <Plus className="size-3" strokeWidth={1.5} />
                        </button>
                      </div>
                      <span className="tabular text-[13px] font-medium">
                        {formatPrice(product.price * line.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Drawer>
  );
}
