import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  CircleUserRound,
  LockKeyhole,
  MapPin,
  Package,
  PencilLine,
  ShieldCheck,
} from "lucide-react";
import type { Category, Product } from "@/types/product";
import { StorefrontLayout } from "@/components/StorefrontLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderHistorySection } from "@/features/orders/OrderTrackingPage";
import { useAuth } from "./useAuth";

type Profile = {
  name: string;
  email: string;
  phone: string;
};

const DEMO_ADDRESS = {
  recipient: "Sana Ibrahim",
  street: "18 Road 9, Maadi",
  city: "Cairo, Egypt",
  phone: "+20 100 123 4567",
};

type SavedAddress = typeof DEMO_ADDRESS;

export function SettingsSkeleton() {
  return (
    <main
      aria-label="Loading account settings"
      className="mx-auto max-w-6xl px-5 pb-16 pt-8 sm:px-8 md:px-0 sm:pt-12"
    >
      <div className="animate-pulse">
        <div className="flex flex-col justify-between gap-5 border-b border-border pb-8 sm:flex-row sm:items-end">
          <div className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-11 w-80 max-w-[80vw]" />
            <Skeleton className="h-4 w-96 max-w-[85vw]" />
          </div>
          <Skeleton className="h-8 w-32 rounded-full" />
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12">
          <div className="flex gap-2 overflow-hidden lg:flex-col">
            {[0, 1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-10 w-32 shrink-0" />
            ))}
          </div>
          <div className="min-w-0 space-y-10">
            <section>
              <Skeleton className="h-3 w-28" />
              <Skeleton className="mt-3 h-8 w-52" />
              <div className="mt-5 space-y-3">
                {[0, 1].map((item) => (
                  <div
                    key={item}
                    className="rounded-md border border-border bg-card p-5 sm:p-6"
                  >
                    <div className="flex items-center gap-4">
                      <Skeleton className="size-11 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-56 max-w-full" />
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
            {[0, 1, 2].map((item) => (
              <section key={item}>
                <Skeleton className="h-3 w-28" />
                <Skeleton className="mt-3 h-8 w-48" />
                <div className="mt-4 rounded-md border border-border bg-card p-6">
                  <div className="grid gap-5 sm:grid-cols-2">
                    {[0, 1, 2, 3].map((field) => (
                      <div key={field}>
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="mt-2 h-5 w-40 max-w-full" />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <p className="eyebrow text-muted-foreground">{children}</p>;
}

function ProfileField({
  label,
  value,
  onChange,
  editing,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  editing: boolean;
  type?: string;
}) {
  return (
    <label className="block text-xs text-muted-foreground">
      {label}
      {editing ? (
        <input
          required
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-clay"
        />
      ) : (
        <span className="mt-2 block truncate text-sm font-medium text-foreground">
          {value}
        </span>
      )}
    </label>
  );
}

export function SettingsPage({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const { user, loading, openAuth } = useAuth();
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileOverride, setProfileOverride] = useState<Profile | null>(null);
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);
  const [resetFeedback, setResetFeedback] = useState(false);
  const [address, setAddress] = useState<SavedAddress>(DEMO_ADDRESS);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressFeedback, setAddressFeedback] = useState<string | null>(null);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [studioNotes, setStudioNotes] = useState(false);

  const profile: Profile = profileOverride ?? {
    name: user?.name ?? user?.username ?? "Sana Ibrahim",
    email: user?.email ?? "sana.ibrahim@example.com",
    phone: DEMO_ADDRESS.phone,
  };

  function startEditingProfile() {
    setProfileOverride(profile);
    setProfileFeedback(null);
    setEditingProfile(true);
  }

  function updateProfile(field: keyof Profile, value: string) {
    setProfileOverride({ ...profile, [field]: value });
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEditingProfile(false);
    setProfileFeedback(
      "Preview saved for this visit only. Account changes are not connected yet.",
    );
  }

  function saveAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEditingAddress(false);
    setAddressFeedback("Address saved for this visit only.");
  }

  const content = loading ? (
    <SettingsSkeleton />
  ) : !user ? (
    <main className="flex min-h-[55vh] flex-col items-center justify-center px-6 text-center">
      <CircleUserRound className="size-8 text-clay" strokeWidth={1.3} />
      <p className="eyebrow mt-5 text-clay">Your account</p>
      <h1 className="mt-3 font-serif text-4xl">A little space of your own.</h1>
      <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
        Sign in to see your orders and account details.
      </p>
      <button
        type="button"
        onClick={openAuth}
        className="mt-6 rounded-full bg-foreground px-5 py-3 text-sm text-background transition-colors hover:bg-clay"
      >
        Sign in to your account
      </button>
    </main>
  ) : (
    <main className="mx-auto max-w-6xl px-5 pb-16 pt-8 sm:px-8 md:px-0 sm:pt-12">
      <div className="flex flex-col justify-between gap-6 border-b border-border pb-8 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-clay">Your account</p>
          <h1 className="mt-3 max-w-2xl font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
            A more considered account.
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Your orders, delivery details, and little preferences—all in one
            place.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-clay/25 bg-clay/5 px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-clay">
          <span className="size-1.5 rounded-full bg-clay" />
          Preview account
        </span>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12">
        <nav
          aria-label="Account sections"
          className="flex gap-2 overflow-x-auto pb-1 lg:sticky lg:top-24 lg:h-fit lg:flex-col lg:overflow-visible"
        >
          {[
            { label: "Your orders", href: "#orders", icon: Package },
            { label: "Personal details", href: "#profile", icon: CircleUserRound },
            { label: "Security", href: "#security", icon: LockKeyhole },
            { label: "Preferences", href: "#preferences", icon: Bell },
          ].map(({ label, href, icon: Icon }) => (
            <a
              key={href}
              href={href}
              className="inline-flex shrink-0 items-center gap-3 rounded-full border border-border bg-card px-4 py-3 text-xs text-foreground/75 transition-colors hover:border-clay/50 hover:text-foreground lg:rounded-xl lg:border-transparent lg:bg-transparent lg:px-3"
            >
              <Icon className="size-4 text-clay" strokeWidth={1.5} />
              {label}
              <ChevronRight className="ml-auto hidden size-3.5 text-muted-foreground lg:block" />
            </a>
          ))}
        </nav>

        <div className="min-w-0 space-y-10">
          <section id="orders" className="scroll-mt-28">
            <OrderHistorySection />
          </section>

          <section id="profile" className="scroll-mt-28">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <SectionLabel>Account details</SectionLabel>
                <h2 className="mt-2 font-serif text-3xl">Personal details</h2>
              </div>
              {!editingProfile && (
                <button
                  type="button"
                  onClick={startEditingProfile}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-xs transition-colors hover:border-clay/50"
                >
                  <PencilLine className="size-3.5" />
                  Edit details
                </button>
              )}
            </div>
            <form
              onSubmit={saveProfile}
              className="rounded-md border border-border bg-card p-5 sm:p-7"
            >
              <div className="flex items-center gap-4 border-b border-border pb-5">
                <span className="flex size-12 items-center justify-center rounded-full bg-clay/10 font-serif text-xl text-clay">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{profile.name}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {profile.email}
                  </p>
                </div>
                <span className="ml-auto hidden rounded-full bg-secondary px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:inline-flex">
                  Demo details
                </span>
              </div>
              <div className="grid gap-5 pt-5 sm:grid-cols-2">
                <ProfileField
                  label="Full name"
                  value={profile.name}
                  editing={editingProfile}
                  onChange={(value) => updateProfile("name", value)}
                />
                <ProfileField
                  label="Email address"
                  type="email"
                  value={profile.email}
                  editing={editingProfile}
                  onChange={(value) => updateProfile("email", value)}
                />
                <ProfileField
                  label="Phone number"
                  type="tel"
                  value={profile.phone}
                  editing={editingProfile}
                  onChange={(value) => updateProfile("phone", value)}
                />
              </div>
              {profileFeedback && (
                <p
                  role="status"
                  className="mt-5 rounded-xl bg-secondary px-4 py-3 text-xs leading-5 text-muted-foreground"
                >
                  {profileFeedback}
                </p>
              )}
              {editingProfile && (
                <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-border pt-5">
                  <button
                    type="button"
                    onClick={() => setEditingProfile(false)}
                    className="h-10 rounded-full px-4 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-xs text-background transition-colors hover:bg-clay"
                  >
                    <Check className="size-3.5" />
                    Save preview
                  </button>
                </div>
              )}
            </form>
          </section>

          <section id="security" className="scroll-mt-28">
            <div className="mb-4">
              <SectionLabel>Keep your account yours</SectionLabel>
              <h2 className="mt-2 font-serif text-3xl">Security</h2>
            </div>
            <div className="flex flex-col gap-5 rounded-md border border-border bg-card p-5 sm:flex-row sm:items-center sm:p-7">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-clay">
                <ShieldCheck className="size-5" strokeWidth={1.4} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Password reset</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Request a reset link for the email address on your account.
                </p>
                {resetFeedback && (
                  <p role="status" className="mt-3 text-xs leading-5 text-clay">
                    Preview only — no email was sent and your password was not
                    changed.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setResetFeedback(true)}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-border px-4 text-xs transition-colors hover:border-clay/50"
              >
                Request reset link <ArrowRight className="size-3.5" />
              </button>
            </div>
          </section>

          <section className="scroll-mt-28">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <SectionLabel>Ready for the next delivery</SectionLabel>
                <h2 className="mt-2 font-serif text-3xl">Saved address</h2>
              </div>
              {!editingAddress && (
                <button
                  type="button"
                  onClick={() => {
                    setAddressFeedback(null);
                    setEditingAddress(true);
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-xs transition-colors hover:border-clay/50"
                >
                  <PencilLine className="size-3.5" />
                  Edit address
                </button>
              )}
            </div>
            <form
              onSubmit={saveAddress}
              className="rounded-md border border-border bg-card p-5 sm:p-7"
            >
              <div className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-clay">
                  <MapPin className="size-5" strokeWidth={1.4} />
                </span>
                <div className="grid min-w-0 flex-1 gap-5 sm:grid-cols-2">
                  <ProfileField
                    label="Recipient"
                    value={address.recipient}
                    editing={editingAddress}
                    onChange={(recipient) =>
                      setAddress({ ...address, recipient })
                    }
                  />
                  <ProfileField
                    label="Phone number"
                    value={address.phone}
                    editing={editingAddress}
                    onChange={(phone) => setAddress({ ...address, phone })}
                  />
                  <ProfileField
                    label="Street address"
                    value={address.street}
                    editing={editingAddress}
                    onChange={(street) => setAddress({ ...address, street })}
                  />
                  <ProfileField
                    label="City"
                    value={address.city}
                    editing={editingAddress}
                    onChange={(city) => setAddress({ ...address, city })}
                  />
                  <div className="sm:col-span-2">
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      Sample address
                    </span>
                  </div>
                </div>
              </div>
              {addressFeedback && (
                <p
                  role="status"
                  className="mt-5 rounded-xl bg-secondary px-4 py-3 text-xs leading-5 text-muted-foreground"
                >
                  {addressFeedback} Address changes are not connected to your
                  account yet.
                </p>
              )}
              {editingAddress && (
                <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-border pt-5">
                  <button
                    type="button"
                    onClick={() => setEditingAddress(false)}
                    className="h-10 rounded-full px-4 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-xs text-background transition-colors hover:bg-clay"
                  >
                    <Check className="size-3.5" />
                    Save preview
                  </button>
                </div>
              )}
            </form>
          </section>

          <section id="preferences" className="scroll-mt-28">
            <div className="mb-4">
              <SectionLabel>A note from Lumina</SectionLabel>
              <h2 className="mt-2 font-serif text-3xl">Preferences</h2>
            </div>
            <div className="divide-y divide-border rounded-md border border-border bg-card px-5 sm:px-7">
              <PreferenceToggle
                checked={orderUpdates}
                onChange={setOrderUpdates}
                title="Order updates"
                description="A note when your order moves to its next step."
              />
              <PreferenceToggle
                checked={studioNotes}
                onChange={setStudioNotes}
                title="Studio letters"
                description="New collections, maker stories, and considered living."
              />
              <p className="py-3 text-[11px] leading-5 text-muted-foreground">
                Preferences are interactive previews and are not saved to your
                account yet.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );

  return (
    <StorefrontLayout products={products} categories={categories}>
      {content}
    </StorefrontLayout>
  );
}

function PreferenceToggle({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-4 py-5">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 shrink-0 accent-clay"
      />
    </label>
  );
}
