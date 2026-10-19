import { Heart, ShoppingBag } from "lucide-react";
import type { Product } from "@/types/product";
import { Drawer } from "@/components/Drawer";
import { SafeImage } from "@/components/motion/SafeImage";
import { formatPrice } from "@/services/api";
import { useCart } from "@/features/cart/useCart";

export function WishlistDrawer({
  open,
  onClose,
  products,
}: {
  open: boolean;
  onClose: () => void;
  products: Product[];
}) {
  const { wishlist, toggleWishlist, addItem } = useCart();
  const saved = products.filter((product) => wishlist.has(product.id));

  return (
    <Drawer
      open={open}
      onClose={onClose}
      eyebrow="Saved"
      title={saved.length === 1 ? "1 piece" : `${saved.length} pieces`}
    >
      {saved.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-5 py-20 text-center">
          <span className="flex size-14 items-center justify-center rounded-full border border-border/80">
            <Heart className="size-5 text-muted-foreground" strokeWidth={1} />
          </span>
          <div className="space-y-2">
            <p className="font-serif text-2xl">Nothing saved yet</p>
            <p className="max-w-[24ch] text-[13px] leading-6 text-muted-foreground">
              Tap the heart on any piece to keep it here for later.
            </p>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-border/70">
          {saved.map((product) => (
            <li key={product.id} className="flex gap-4 py-5 first:pt-0">
              <a
                href={`/products/${product.slug}`}
                onClick={onClose}
                className="size-24 shrink-0 overflow-hidden rounded-xl bg-muted"
                aria-label={`View ${product.name}`}
              >
                <SafeImage src={product.images[0]} alt={product.name} />
              </a>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="eyebrow text-muted-foreground">
                  {product.category}
                </p>
                <p className="mt-1 font-serif text-lg leading-tight">
                  {product.name}
                </p>
                <span className="tabular mt-1 text-[12px]">
                  {formatPrice(product.price)}
                </span>
                <div className="mt-auto flex items-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      addItem(product);
                      toggleWishlist(product.id);
                    }}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium transition-colors hover:text-clay"
                  >
                    <ShoppingBag className="size-3.5" strokeWidth={1.25} />
                    Add to bag
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product.id)}
                    className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
