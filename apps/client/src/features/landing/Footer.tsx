import { Mail, MapPin } from "lucide-react";

const COLUMNS = [
  {
    title: "Shop",
    links: ["Living", "Dining", "Lighting", "Objects", "Gift cards"],
  },
  {
    title: "Studio",
    links: ["About us", "Our makers", "Journal", "Sustainability"],
  },
  {
    title: "Care",
    links: ["Shipping & returns", "Care guide", "Contact", "FAQ"],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border/70 px-4 pt-16 pb-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-14">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div className="space-y-6">
            <p className="font-serif text-[26px] leading-none tracking-[0.18em] uppercase">
              Lumina
            </p>
            <p className="max-w-xs text-[13px] leading-6 text-muted-foreground">
              Objects for considered living, made in small batches by workshops
              we know by name.
            </p>
            <div className="flex items-center gap-4 text-muted-foreground">
              <a
                href="#top"
                aria-label="Instagram"
                className="transition-colors duration-300 hover:text-foreground"
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
                href="#newsletter"
                aria-label="Newsletter"
                className="transition-colors duration-300 hover:text-foreground"
              >
                <Mail className="size-4" strokeWidth={1.25} />
              </a>
              <span className="flex items-center gap-1.5 text-[11px]">
                <MapPin className="size-3.5" strokeWidth={1.25} />
                Copenhagen · Lisbon
              </span>
            </div>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-8 sm:grid-cols-3"
          >
            {COLUMNS.map((column) => (
              <div key={column.title} className="space-y-4">
                <p className="eyebrow text-muted-foreground">{column.title}</p>
                <ul className="space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#featured"
                        className="text-[13px] text-foreground/70 transition-colors duration-300 hover:text-foreground"
                      >
                        {link}
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
            <a href="#top" className="transition-colors hover:text-foreground">
              Privacy
            </a>
            <a href="#top" className="transition-colors hover:text-foreground">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
