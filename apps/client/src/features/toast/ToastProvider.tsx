import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Check, X } from "lucide-react";
import { ToastContext, type ToastItem } from "./toast-context";

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, detail?: string) => {
      const item: ToastItem = { id: nextId++, message, detail, tone: "success" };
      setItems((current) => [...current.slice(-2), item]);
      window.setTimeout(() => dismiss(item.id), 3200);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-8"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="reveal-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-full bg-foreground py-2.5 pr-3 pl-4 text-background shadow-[0_18px_40px_-20px_rgba(26,24,21,0.55)]"
            style={{ animationDuration: "420ms" }}
          >
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-background/15">
              {item.tone === "success" ? (
                <Check className="size-3" strokeWidth={1.5} />
              ) : (
                <X className="size-3" strokeWidth={1.5} />
              )}
            </span>
            <p className="flex-1 text-[13px] leading-5">
              {item.message}
              {item.detail && (
                <span className="ml-1.5 text-background/60">— {item.detail}</span>
              )}
            </p>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label="Dismiss notification"
              className="mt-0.5 rounded-full p-0.5 text-background/50 transition-colors duration-300 hover:text-background"
            >
              <X className="size-3.5" strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
