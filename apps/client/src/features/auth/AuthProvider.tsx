import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Drawer } from "@/components/Drawer";
import { AuthContext, type AuthUser } from "./auth-context";
import { apiRequest, authenticatedRequest } from "./auth-client";
import { GoogleSignInButton } from "./GoogleSignInButton";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    apiRequest<{ user: AuthUser }>("/auth/me")
      .then(async ({ user: currentUser }) => {
        setUser(currentUser);
        const { csrfToken: token } = await apiRequest<{ csrfToken: string }>(
          "/auth/csrf",
        );
        setCsrfToken(token);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const logout = useCallback(async () => {
    try {
      if (csrfToken) {
        await authenticatedRequest("/auth/logout", csrfToken, {
          method: "POST",
        });
      }
    } finally {
      // Clear client state even if an expired session makes logout fail.
      setUser(null);
      setCsrfToken(null);
    }
  }, [csrfToken]);

  const value = useMemo(
    () => ({ user, loading, csrfToken, openAuth: () => setOpen(true), logout }),
    [csrfToken, loading, logout, user],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthDrawer
        open={open}
        onClose={() => setOpen(false)}
        onAuthenticated={(result) => {
          setUser(result.user);
          setCsrfToken(result.csrfToken);
          setOpen(false);
        }}
      />
    </AuthContext.Provider>
  );
}
function AuthDrawer({
  open,
  onClose,
  onAuthenticated,
}: {
  open: boolean;
  onClose: () => void;
  onAuthenticated: (result: { user: AuthUser; csrfToken: string }) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await apiRequest<{ user: AuthUser; csrfToken: string }>(
        `/auth/${mode === "login" ? "login" : "register"}`,
        {
          method: "POST",
          body: JSON.stringify(
            mode === "login"
              ? { email, password }
              : { username, email, password },
          ),
        },
      );
      onAuthenticated(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleAuthenticated = useCallback(
    (result: { user: AuthUser; csrfToken: string }) => onAuthenticated(result),
    [onAuthenticated],
  );

  const handleGoogleError = useCallback(
    (message: string) => setError(message),
    [],
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      eyebrow="Your account"
      title={mode === "login" ? "Welcome back" : "Create an account"}
    >
      <form onSubmit={submit} className="space-y-5">
        <p className="text-sm leading-6 text-muted-foreground">
          {mode === "login"
            ? "Sign in to save pieces, manage your bag, and write reviews."
            : "Create an account to save pieces, manage your bag, and write reviews."}
        </p>
        {mode === "register" && (
          <label className="block text-sm font-medium">
            Username
            <input
              required
              minLength={3}
              maxLength={30}
              pattern="[A-Za-z0-9_]+"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
              autoComplete="username"
            />
          </label>
        )}
        <label className="block text-sm font-medium">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
            autoComplete="email"
          />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input
            required
            type="password"
            minLength={12}
            maxLength={128}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
          />
          <span className="mt-2 block text-xs font-normal text-muted-foreground">
            At least 12 characters.
          </span>
        </label>
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <button
          disabled={submitting}
          type="submit"
          className="h-11 w-full rounded-full bg-foreground text-sm font-medium text-background disabled:opacity-60"
        >
          {submitting
            ? "Please wait…"
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
          }}
          className="w-full text-sm text-muted-foreground underline underline-offset-4"
        >
          {mode === "login"
            ? "New here? Create an account"
            : "Already have an account? Sign in"}
        </button>
        <div className="space-y-4 border-t border-border pt-5">
          <p className="text-center text-xs text-muted-foreground">
            Google signs in an existing account or securely creates a new one.
          </p>
          <GoogleSignInButton
            onAuthenticated={handleGoogleAuthenticated}
            onError={handleGoogleError}
          />
        </div>
      </form>
    </Drawer>
  );
}
