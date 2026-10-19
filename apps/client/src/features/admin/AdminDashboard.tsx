import { useEffect, useState } from "react";
import { apiRequest } from "@/features/auth/auth-client";
import { useAuth } from "@/features/auth/useAuth";

export function AdminDashboard() {
  const { user, loading, openAuth } = useAuth();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== "admin") return;
    apiRequest<{ message: string }>("/admin/dashboard/overview")
      .then((data) => setMessage(data.message))
      .catch(() => setMessage("Unable to load the dashboard."));
  }, [user?.role]);

  if (loading)
    return (
      <main className="flex min-h-screen items-center justify-center">
        Loading…
      </main>
    );

  if (!user)
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-serif text-4xl">Sign in required</h1>
        <button
          type="button"
          onClick={openAuth}
          className="rounded-full bg-foreground px-5 py-3 text-sm text-background"
        >
          Sign in
        </button>
      </main>
    );

  if (user.role !== "admin")
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="eyebrow text-clay">403</p>
        <h1 className="font-serif text-4xl">Admin access only</h1>
        <a href="/" className="mt-3 text-sm underline underline-offset-4">
          Return to the store
        </a>
      </main>
    );

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <p className="eyebrow text-clay">Administration</p>
        <h1 className="mt-3 font-serif text-5xl">Dashboard</h1>
        <p className="mt-5 text-sm text-muted-foreground">
          {message ?? "Loading dashboard…"}
        </p>
      </div>
    </main>
  );
}
