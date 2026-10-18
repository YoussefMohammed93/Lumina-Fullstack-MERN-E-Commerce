import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { Product } from "@/types/product";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { SafeImage } from "@/components/motion/SafeImage";
import { StarRating } from "@/components/StarRating";
import { ArrowButton } from "@/components/ArrowButton";
import { useCart } from "@/features/cart/CartProvider";
import { useToast } from "@/features/toast/ToastProvider";
import { formatPrice } from "@/services/api";
import { cn } from "@/lib/utils";

export function QuickView({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const { addItem } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    setQuantity(1);
    setActiveImage(0);
  }, [product?.id]);

  const handleAdd = () => {
    if (!product) return;
    addItem(product, quantity);
    toast("Added to your bag", `${quantity} × ${product.name}`);
    onClose();
  };

  return (
    <Dialog open={Boolean(product)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-h-[92vh] max-w-3xl gap-0 overflow-y-auto rounded-[1.75rem] border-0 bg-background p-0 ring-1 ring-foreground/10"
        showCloseButton
      >
        {product && (
          <div className="grid md:grid-cols-2">
            <div className="space-y-3 bg-muted/60 p-3">
              <div className="aspect-[4/5] overflow-hidden rounded-[1.2rem] bg-muted">
                <SafeImage
                  src={product.images[activeImage] ?? product.images[0]}
                  alt={product.name}
                />
              </div>
              {product.images.length > 1 && (
                <div className="flex gap-2">
                  {product.images.map((image, index) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      aria-label={`View image ${index + 1}`}
                      className={cn(
                        "size-14 overflow-hidden rounded-lg ring-1 transition-opacity",
                        index === activeImage
                          ? "ring-foreground/40"
                          : "opacity-60 ring-transparent hover:opacity-100",
                      )}
                    >
                      <SafeImage src={image} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-6 p-6 sm:p-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="eyebrow text-clay">{product.category}</p>
                  <StarRating rating={product.rating} count={product.reviewCount} showCount />
                </div>
                <DialogTitle className="font-serif text-3xl leading-tight font-normal tracking-tight">
                  {product.name}
                </DialogTitle>
                <div className="flex items-baseline gap-3">
                  <span className="tabular text-lg font-medium">
                    {formatPrice(product.price)}
                  </span>
                  {product.compareAtPrice && (
                    <span className="tabular text-[13px] text-muted-foreground line-through">
                      {formatPrice(product.compareAtPrice)}
                    </span>
                  )}
                </div>
                <DialogDescription className="text-[13px] leading-6 text-muted-foreground">
                  {product.description}
                </DialogDescription>
              </div>

              <dl className="space-y-2 border-t border-border/70 pt-5 text-[12px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Materials</dt>
                  <dd className="text-right font-medium">{product.materials}</dd>
                </div>
                {product.dimensions && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Dimensions</dt>
                    <dd className="tabular text-right font-medium">{product.dimensions}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Availability</dt>
                  <dd className="text-right font-medium">
                    {product.stock > 0 ? `${product.stock} in stock` : "Sold out"}
                  </dd>
                </div>
              </dl>

              <div className="mt-auto space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center rounded-full border border-border">
                    <button
                      type="button"
                      onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                      aria-label="Decrease quantity"
                      className="flex size-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Minus className="size-3.5" strokeWidth={1.5} />
                    </button>
                    <span className="tabular w-8 text-center text-[13px]">{quantity}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((value) => Math.min(product.stock || 1, value + 1))
                      }
                      aria-label="Increase quantity"
                      className="flex size-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Plus className="size-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                  <span className="tabular text-[13px] text-muted-foreground">
                    {formatPrice(product.price * quantity)}
                  </span>
                </div>

                <ArrowButton
                  onClick={handleAdd}
                  disabled={product.stock === 0}
                  className="w-full justify-between"
                >
                  {product.stock === 0 ? "Sold out" : "Add to bag"}
                </ArrowButton>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
