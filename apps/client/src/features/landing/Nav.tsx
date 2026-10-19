import { useEffect, useRef, useState } from "react";
import {
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { useScrolled } from "@/hooks/useScrolled";
import { useScrollLock } from "@/hooks/useOverlay";
import { useCart } from "@/features/cart/useCart";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/#collections" },
  { label: "Journal", href: "/journal" },
  { label: "About", href: "/about" },
];

function isCurrentLink(href: string) {
  const { pathname, hash } = window.location;
  if (href.includes("#")) return href === `${pathname}${hash}`;
  return pathname === href;
}

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
  const { totalQuantity, wishlist } = useCart();
  const { user, openAuth, logout } = useAuth();
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const wasFocusedRef = useRef<HTMLElement | null>(null);
  const mobileLinks = user?.role === "admin"
    ? [...LINKS, { label: "Dashboard", href: "/admin" }]
    : LINKS;

  useScrollLock(menuOpen);

  useEffect(() => {
    if (!menuOpen) return;
    wasFocusedRef.current = document.activeElement as HTMLElement;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        mobileMenuRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    mobileMenuRef.current?.querySelector<HTMLElement>("a")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      wasFocusedRef.current?.focus();
    };
  }, [menuOpen]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false);
    };
    media.addEventListener("change", closeOnDesktop);
    return () => media.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <>
      <div className="sticky top-0 z-40 px-4 pt-3 sm:px-6 lg:px-8">
        <header
          className={cn(
            "relative mx-auto flex h-16 max-w-6xl items-center gap-3 rounded-full border px-2 pr-2 pl-5 transition-all duration-700 ease-luxe sm:gap-8 sm:pl-7",
            scrolled
              ? "border-border/80 bg-background/80 shadow-[0_18px_40px_-30px_rgba(26,24,21,0.45)] backdrop-blur-sm"
              : "border-transparent bg-background/40",
          )}
        >
          <Wordmark />

          <nav
            aria-label="Primary"
            className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 md:flex"
          >
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                aria-current={isCurrentLink(link.href) ? "page" : undefined}
                className="group relative text-[13px] text-foreground/70 transition-colors duration-300 hover:text-foreground"
              >
                {link.label}
                <span
                  className={cn(
                    "absolute -bottom-1 left-0 h-px bg-clay transition-[width] duration-500 ease-luxe group-hover:w-full",
                    isCurrentLink(link.href) ? "w-full" : "w-0",
                  )}
                />
              </a>
            ))}
            {user?.role === "admin" && (
              <a
                href="/admin"
                aria-current={isCurrentLink("/admin") ? "page" : undefined}
                className="group relative text-[13px] text-foreground/70 transition-colors duration-300 hover:text-foreground"
              >
                Dashboard
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-clay transition-[width] duration-500 ease-luxe group-hover:w-full" />
              </a>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-1">
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
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Open account menu"
                    className="rounded-full outline-none ring-clay/40 transition-shadow focus-visible:ring-2"
                  >
                    <Avatar className="bg-secondary !size-9 text-foreground">
                      <AvatarImage
                        key={user.avatarUrl}
                        src={user.avatarUrl}
                        alt={user.name ?? user.username}
                        referrerPolicy="no-referrer"
                      />
                      <AvatarFallback className="bg-secondary text-base text-clay">
                        {(user.name ?? user.username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={12}
                  className="w-64 rounded-[1.25rem] border-border bg-card p-2 shadow-[0_20px_50px_-24px_rgba(26,24,21,0.48)]"
                >
                  <DropdownMenuLabel className="px-3 py-2.5">
                    <p className="truncate text-sm font-medium text-foreground">
                      {user.name ?? user.username}
                    </p>
                    <p className="mt-0.5 truncate text-xs font-normal text-muted-foreground">
                      {user.email}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="mx-1 bg-border/70" />
                  <DropdownMenuItem
                    asChild
                    className="mt-1 min-h-10 rounded-xl px-3 text-[13px] focus:bg-secondary"
                  >
                    <a href="/settings">
                      <Settings className="size-4" />
                      Settings
                    </a>
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <DropdownMenuItem
                      asChild
                      className="min-h-10 rounded-xl px-3 text-[13px] focus:bg-secondary"
                    >
                      <a href="/admin">
                        <LayoutDashboard className="size-4" />
                        Dashboard
                      </a>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="mx-1 bg-border/70" />
                  <DropdownMenuItem
                    onSelect={() => void logout()}
                    variant="destructive"
                    className="min-h-10 rounded-xl px-3 text-[13px]"
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                type="button"
                onClick={openAuth}
                title="Sign in"
                className="flex size-10 items-center justify-center rounded-full text-foreground/75 transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
                aria-label="Sign in"
              >
                <UserRound className="size-[18px]" strokeWidth={1.25} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
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
        <div
          id="mobile-navigation"
          ref={mobileMenuRef}
          className="fixed inset-0 z-30 flex flex-col bg-background px-6 pt-28 pb-10 md:hidden"
        >
          <nav aria-label="Mobile" className="flex flex-col gap-2">
            {mobileLinks.map((link, index) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                aria-current={isCurrentLink(link.href) ? "page" : undefined}
                className="reveal-in flex items-baseline justify-between border-b border-border/60 py-4"
                style={{ animationDelay: `${80 + index * 70}ms` }}
              >
                <span className="font-serif text-4xl tracking-tight">
                  {link.label}
                </span>
                <span className="eyebrow text-muted-foreground">
                  0{index + 1}
                </span>
              </a>
            ))}
          </nav>

          <div className="mt-auto space-y-4">
            {!user && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  openAuth();
                }}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm transition-colors hover:bg-secondary"
              >
                <UserRound className="size-4" strokeWidth={1.5} />
                Sign in
              </button>
            )}
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
