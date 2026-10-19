import { useAuth } from "./useAuth";

export function SettingsPage() {
  const { user, loading, openAuth } = useAuth();
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

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <section className="mx-auto max-w-2xl">
        <p className="eyebrow text-clay">Account</p>
        <h1 className="mt-3 font-serif text-5xl">Settings</h1>
        <div className="mt-10 rounded-[1.5rem] border border-border bg-card p-6">
          <p className="text-sm font-medium">{user.name ?? user.username}</p>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          <p className="mt-6 text-sm leading-6 text-muted-foreground">
            Profile editing and password management will be added here next.
          </p>
        </div>
      </section>
    </main>
  );
}
