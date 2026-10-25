import { useEffect, useState } from "react";
import { Clock, Mail, MapPin } from "lucide-react";
import type { Category } from "@/types/product";
import { fetchCategories } from "@/services/api";

const COLUMNS = [
  {
    title: "Shop",
    links: [],
  },
  {
    title: "Studio",
    links: [
      { label: "About us", href: "/about" },
      { label: "Our makers", href: "/about" },
      { label: "Journal", href: "/journal" },
      { label: "Sustainability", href: "/about" },
    ],
  },
  {
    title: "Care",
    links: [
      { label: "Shipping & returns", href: "/shipping-returns" },
      { label: "Care guide", href: "/care-guide" },
      { label: "Contact", href: "/#newsletter" },
      { label: "FAQ", href: "/faq" },
    ],
  },
];

export function Footer({ categories }: { categories?: Category[] }) {
  const [loadedCategories, setLoadedCategories] = useState<Category[]>([]);
  useEffect(() => {
    if (categories !== undefined) return;
    let cancelled = false;
    fetchCategories()
      .then((items) => {
        if (!cancelled) setLoadedCategories(items);
      })
      .catch((error: unknown) => {
        console.error("Unable to load footer categories.", error);
      });
    return () => {
      cancelled = true;
    };
  }, [categories]);
  const activeCategories = categories ?? loadedCategories;
  const columns = COLUMNS.map((column) =>
    column.title === "Shop"
      ? {
          ...column,
          links: [
            ...activeCategories
              .filter((category) => category.isActive)
              .slice(0, 4)
              .map((category) => ({
                label: category.name,
                href: `/shop?category=${encodeURIComponent(category.name)}`,
              })),
            { label: "All pieces", href: "/shop" },
          ],
        }
      : column,
  );
  return (
    <footer className="border-t border-border/70 px-4 pt-16 pb-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-14">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div className="space-y-6">
            <a
              href="/"
              aria-label="Lumina home"
              className="block h-9 w-[155px] rounded-sm bg-center bg-no-repeat focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
              style={{
                backgroundImage: "url('/logo-text.png')",
                backgroundSize: "155px 60px",
              }}
            >
            </a>
            <p className="max-w-xs text-[13px] leading-6 text-muted-foreground">
              Objects for considered living, made in small batches by workshops
              we know by name.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <a
                href="www.instagram.com"
                aria-label="Instagram"
                className="rounded-sm transition-colors duration-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.25}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-4"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a
                href="mailto:lumina@gmail.com"
                className="flex items-center gap-1.5 rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
              >
                <Mail className="size-4" strokeWidth={1.25} />{" "}
              </a>
              <span className="flex items-center gap-1.5 text-[11px]">
                <MapPin className="size-3.5" strokeWidth={1.25} />
                Mansoura, Egypt
              </span>
              <span className="flex items-center gap-1.5 text-[11px]">
                <Clock className="size-3.5" strokeWidth={1.25} />
                Daily, 8 am–2 pm
              </span>
            </div>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-8 sm:grid-cols-3"
          >
            {columns.map((column) => (
              <div key={column.title} className="space-y-4">
                <p className="eyebrow text-muted-foreground">{column.title}</p>
                <ul className="space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="rounded-sm text-[13px] text-foreground/70 transition-colors duration-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-4 border-t border-border/70 pt-6 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Lumina Studio. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <a
              href="/privacy"
              className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
            >
              Privacy
            </a>
            <a
              href="/terms"
              className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
