import { useEffect, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useScrolled } from "@/hooks/useScrolled";
import { useScrollLock } from "@/hooks/useOverlay";
import { useCart } from "@/features/cart/CartProvider";
import { cn } from "@/lib/utils";

const LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "#collections" },
  { label: "Journal", href: "#journal" },
  { label: "About", href: "#about" },
];

function Wordmark() {
  return (
    <a
      href="/"
      className="flex items-baseline gap-2 font-serif text-[22px] leading-none tracking-[0.18em] uppercase"
      aria-label="LUMINA home"
    >
      Lumina
      <span className="eyebrow hidden translate-y-[-1px] text-muted-foreground sm:inline">
        Est. 2019
      </span>
    </a>
  );
}

function IconButton({
  label,
  onClick,
  children,
  count,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative flex size-10 items-center justify-center rounded-full text-foreground/75 transition-colors duration-500 ease-luxe hover:bg-foreground/[0.05] hover:text-foreground"
    >
      {children}
      {count !== undefined && count > 0 && (
        <span className="tabular absolute -top-0.5 -right-0.5 flex size-[18px] items-center justify-center rounded-full bg-clay text-[10px] font-medium text-background">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}

export function Nav({
  onSearch,
  onCart,
  onWishlist,
}: {
  onSearch: () => void;
  onCart: () => void;
  onWishlist: () => void;
}) {
  const scrolled = useScrolled(16);
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalQuantity } = useCart();
  const { wishlist } = useCart();

  useScrollLock(menuOpen);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <>
      <div className="sticky top-0 z-40 px-4 pt-3 sm:px-6 lg:px-8">
        <header
          className={cn(
            "mx-auto flex h-16 max-w-6xl items-center gap-3 rounded-full border px-2 pr-2 pl-5 transition-all duration-700 ease-luxe sm:gap-8 sm:pl-7",
            scrolled
              ? "border-border/80 bg-background/80 shadow-[0_18px_40px_-30px_rgba(26,24,21,0.45)] backdrop-blur-sm"
              : "border-transparent bg-background/40",
          )}
        >
          <Wordmark />

          <nav aria-label="Primary" className="ml-4 hidden items-center gap-7 md:flex">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group relative text-[13px] text-foreground/70 transition-colors duration-300 hover:text-foreground"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-clay transition-[width] duration-500 ease-luxe group-hover:w-full" />
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-0.5">
            <IconButton label="Search products" onClick={onSearch}>
              <Search className="size-[18px]" strokeWidth={1.25} />
            </IconButton>
            <IconButton
              label="Open saved list"
              onClick={onWishlist}
              count={wishlist.size}
            >
              <Heart className="size-[18px]" strokeWidth={1.25} />
            </IconButton>
            <IconButton label="Open bag" onClick={onCart} count={totalQuantity}>
              <ShoppingBag className="size-[18px]" strokeWidth={1.25} />
            </IconButton>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className="flex size-10 items-center justify-center rounded-full text-foreground/75 transition-colors hover:text-foreground md:hidden"
            >
              {menuOpen ? (
                <X className="size-5" strokeWidth={1.25} />
              ) : (
                <Menu className="size-5" strokeWidth={1.25} />
              )}
            </button>
          </div>
        </header>
      </div>

      {/* Mobile menu — full-screen ivory overlay with staggered links. */}
      {menuOpen && (
        <div className="fixed inset-0 z-30 flex flex-col bg-background px-6 pt-28 pb-10 md:hidden">
          <nav aria-label="Mobile" className="flex flex-col gap-2">
            {LINKS.map((link, index) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="reveal-in flex items-baseline justify-between border-b border-border/60 py-4"
                style={{ animationDelay: `${80 + index * 70}ms` }}
              >
                <span className="font-serif text-4xl tracking-tight">{link.label}</span>
                <span className="eyebrow text-muted-foreground">0{index + 1}</span>
              </a>
            ))}
          </nav>

          <div className="mt-auto space-y-4">
            <p className="text-[13px] leading-6 text-muted-foreground">
              Objects for considered living — made in small batches, shipped
              within 48 hours.
            </p>
            <p className="eyebrow text-clay">Lumina · Est. 2019</p>
          </div>
        </div>
      )}
    </>
  );
}
