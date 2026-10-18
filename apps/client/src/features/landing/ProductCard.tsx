import { useState } from "react";
import { Heart, ShoppingBag } from "lucide-react";
import type { Product } from "@/types/product";
import { formatPrice } from "@/services/api";
import { SafeImage } from "@/components/motion/SafeImage";
import { StarRating } from "@/components/StarRating";
import { useCart } from "@/features/cart/CartProvider";
import { useToast } from "@/features/toast/ToastProvider";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  onQuickView,
  className,
}: {
  product: Product;
  onQuickView: (product: Product) => void;
  className?: string;
}) {
  const { addItem, isWishlisted, toggleWishlist } = useCart();
  const { toast } = useToast();
  const [added, setAdded] = useState(false);
  const wished = isWishlisted(product.id);

  const handleAdd = () => {
    addItem(product);
    toast("Added to your bag", product.name);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  const handleWishlist = () => {
    const nowSaved = toggleWishlist(product.id);
    toast(nowSaved ? "Saved to your list" : "Removed from your list", product.name);
  };

  return (
    <article className={cn("group/card flex flex-col", className)}>
      <div className="relative overflow-hidden rounded-[1.5rem] bg-muted">
        <button
          type="button"
          onClick={() => onQuickView(product)}
          className="block aspect-[4/5] w-full overflow-hidden"
          aria-label={`View ${product.name}`}
        >
          <SafeImage
            src={product.images[0]}
            alt={product.name}
            className="transition-transform duration-[1200ms] ease-luxe group-hover/card:scale-[1.045]"
          />
        </button>

        {product.badge && (
          <span className="eyebrow absolute top-4 left-4 rounded-full bg-background/90 px-2.5 py-1.5 text-foreground backdrop-blur-sm">
            {product.badge === "new" ? "New" : product.badge === "limited" ? "Last pieces" : "Reduced"}
          </span>
        )}

        <button
          type="button"
          onClick={handleWishlist}
          aria-label={wished ? `Remove ${product.name} from list` : `Save ${product.name} to list`}
          aria-pressed={wished}
          className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-background/80 text-foreground/70 backdrop-blur-sm transition-all duration-500 ease-luxe hover:bg-background hover:text-foreground"
        >
          <Heart
            strokeWidth={1.25}
            className={cn(
              "size-4 transition-colors duration-300",
              wished && "fill-clay text-clay",
            )}
          />
        </button>

        <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-500 ease-luxe group-hover/card:translate-y-0 group-hover/card:opacity-100 max-md:hidden">
          <button
            type="button"
            onClick={handleAdd}
            disabled={product.stock === 0}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-background/95 text-[13px] font-medium text-foreground shadow-[0_12px_30px_-16px_rgba(26,24,21,0.5)] backdrop-blur-sm transition-colors duration-300 hover:bg-background disabled:opacity-60"
          >
            <ShoppingBag className="size-3.5" strokeWidth={1.5} />
            {added ? "Added" : product.stock === 0 ? "Sold out" : "Quick add"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-1 pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow text-muted-foreground">{product.category}</p>
          <StarRating rating={product.rating} />
        </div>
        <h3 className="font-serif text-xl leading-snug tracking-tight">
          <button
            type="button"
            onClick={() => onQuickView(product)}
            className="text-left transition-colors duration-300 hover:text-clay"
          >
            {product.name}
          </button>
        </h3>
        <div className="mt-auto flex items-baseline gap-2 pt-1.5">
          <span className="tabular text-[13px] font-medium">
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice && (
            <span className="tabular text-[12px] text-muted-foreground line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
