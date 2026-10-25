import { createContext, useContext } from "react";

type ToastTone = "success" | "info";

export interface ToastItem {
  id: number;
  message: string;
  detail?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (message: string, detail?: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>");
  return context;
}
