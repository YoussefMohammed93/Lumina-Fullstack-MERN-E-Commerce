import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrollLock } from "@/hooks/useOverlay";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  side?: "right" | "left";
  className?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Hand-rolled sheet: portal + focus trap + Escape + scroll lock. Kept local so
 * it mirrors the shadcn sheet API and can be swapped for it one-for-one.
 */
export function Drawer({
  open,
  onClose,
  title,
  eyebrow,
  side = "right",
  className,
  children,
  footer,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useScrollLock(open);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }, 60);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
      restoreFocusRef.current?.focus();
    };
  }, [handleKeyDown, open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className="absolute inset-0 animate-[fade-in_300ms_ease-out] bg-foreground/25 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute inset-y-0 flex w-full max-w-md flex-col bg-background shadow-[0_0_80px_-20px_rgba(26,24,21,0.45)]",
          side === "right" ? "right-0" : "left-0",
          "animate-[drawer-in_520ms_cubic-bezier(0.32,0.72,0,1)_both]",
          className,
        )}
      >
        <header className="flex items-start justify-between gap-6 border-b border-border/70 px-6 py-6">
          <div className="space-y-2">
            {eyebrow && <p className="eyebrow text-clay">{eyebrow}</p>}
            <h2 className="font-serif text-2xl tracking-tight">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 items-center justify-center rounded-full border border-border/80 text-muted-foreground transition-colors duration-300 ease-luxe hover:border-foreground/25 hover:text-foreground"
          >
            <X className="size-4" strokeWidth={1.25} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>

        {footer && (
          <footer className="border-t border-border/70 bg-card/60 px-6 py-5">
            {footer}
          </footer>
        )}
      </div>
      <style>{`
        @keyframes drawer-in {
          from { transform: translate3d(${side === "right" ? "100%" : "-100%"}, 0, 0); }
          to { transform: translate3d(0, 0, 0); }
        }
        @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </div>,
    document.body,
  );
}
