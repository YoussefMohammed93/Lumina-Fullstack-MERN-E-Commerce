import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { Product } from "@/types/product";
import { SafeImage } from "@/components/motion/SafeImage";
import { useScrollLock } from "@/hooks/useOverlay";
import { formatPrice } from "@/services/api";

const SUGGESTIONS = ["Seating", "Tableware", "Lighting", "Ceramics", "Linen"];

export function SearchOverlay({
  open,
  onClose,
  products,
}: {
  open: boolean;
  onClose: () => void;
  products: Product[];
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      setQuery("");
      inputRef.current?.focus();
    }, 80);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose, open]);

  const results = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return [];
    return products
      .filter(
        (product) =>
          product.name.toLowerCase().includes(value) ||
          product.category.toLowerCase().includes(value) ||
          product.materials.toLowerCase().includes(value) ||
          product.description.toLowerCase().includes(value),
      )
      .slice(0, 5);
  }, [products, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="border-b border-border/70 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex h-20 max-w-4xl items-center gap-4">
          <Search
            className="size-5 shrink-0 text-muted-foreground"
            strokeWidth={1.25}
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pieces, materials, rooms…"
            aria-label="Search products"
            className="h-full flex-1 bg-transparent font-serif text-2xl tracking-tight outline-none placeholder:text-muted-foreground/50 sm:text-3xl"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors duration-300 hover:text-foreground"
          >
            <X className="size-4" strokeWidth={1.25} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {!query && (
            <div className="space-y-5">
              <p className="eyebrow text-muted-foreground">Popular searches</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setQuery(suggestion)}
                    className="h-9 rounded-full border border-border px-4 text-[12px] text-foreground/70 transition-colors duration-300 hover:border-foreground/30 hover:text-foreground"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && results.length === 0 && (
            <div className="space-y-2 py-8 text-center">
              <p className="font-serif text-3xl">Nothing matches “{query}”</p>
              <p className="text-[13px] text-muted-foreground">
                Try a room, a material, or a shorter word.
              </p>
            </div>
          )}

          {results.length > 0 && (
            <ul className="divide-y divide-border/70">
              {results.map((product) => (
                <li key={product.id}>
                  <a
                    href={`/products/${product.slug}`}
                    onClick={onClose}
                    className="group flex w-full items-center gap-5 py-4 text-left"
                  >
                    <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                      <SafeImage src={product.images[0]} alt={product.name} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="eyebrow text-muted-foreground">
                        {product.category}
                      </p>
                      <p className="mt-0.5 truncate font-serif text-xl group-hover:text-clay">
                        {product.name}
                      </p>
                    </div>
                    <span className="tabular shrink-0 text-[13px]">
                      {formatPrice(product.price)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
