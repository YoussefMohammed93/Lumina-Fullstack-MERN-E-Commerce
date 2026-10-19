import { useEffect, useState } from "react";
import type { AuthUser } from "./auth-context";
import { apiRequest } from "./auth-client";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: Record<string, string | number>,
          ) => void;
        };
      };
    };
  }
}

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export function GoogleSignInButton({
  onAuthenticated,
  onError,
}: {
  onAuthenticated: (result: { user: AuthUser; csrfToken: string }) => void;
  onError: (message: string) => void;
}) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.floor(entry.contentRect.width));
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [container]);

  useEffect(() => {
    if (!clientId || !container || width < 120) return;
    const render = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          try {
            onAuthenticated(
              await apiRequest<{ user: AuthUser; csrfToken: string }>(
                "/auth/google",
                { method: "POST", body: JSON.stringify({ credential }) },
              ),
            );
          } catch (error) {
            onError(
              error instanceof Error ? error.message : "Google sign-in failed.",
            );
          }
        },
      });

      container.replaceChildren();
      window.google.accounts.id.renderButton(container, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        width,
      });
    };
    if (window.google) render();
    else {
      const script = document.createElement("script");

      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = render;
      document.head.append(script);
      return () => {
        script.onload = null;
      };
    }
  }, [container, onAuthenticated, onError, width]);

  if (!clientId)
    return (
      <p className="text-center text-xs text-muted-foreground">
        Google sign-in is unavailable until `VITE_GOOGLE_CLIENT_ID` is
        configured.
      </p>
    );

  return (
    <div
      ref={setContainer}
      className="flex min-h-11 w-full justify-center overflow-hidden"
    />
  );
}
