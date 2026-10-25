import { useRef, useState, type FormEvent, type ChangeEvent } from "react";
import {
  Bell,
  Check,
  ChevronRight,
  CircleUserRound,
  ImagePlus,
  MapPin,
  Package,
  PencilLine,
  Trash2,
  Upload,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import type { Category, Product } from "@/types/product";
import { StorefrontLayout } from "@/components/StorefrontLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderHistorySection } from "@/features/orders/OrderTrackingPage";
import { useToast } from "@/features/toast/toast-context";
import { authenticatedRequest } from "./auth-client";
import { useAuth } from "./useAuth";

type Profile = {
  name: string;
  email: string;
  phone: string;
};

type SavedAddress = {
  name: string;
  phone: string;
  governorate: string;
  line1: string;
  line2: string;
  city: string;
  postalCode: string;
  country: string;
};

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
  editing = false,
  required = true,
  type = "text",
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  editing?: boolean;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-xs text-muted-foreground">
      {label}
      {editing ? (
        <input
          required={required}
          type={type}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
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
  const { user, loading, csrfToken, openAuth, updateUser } = useAuth();
  const { toast } = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileOverride, setProfileOverride] = useState<Profile | null>(null);
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarDraft, setAvatarDraft] = useState<{
    url: string;
    publicId: string;
  } | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [addressDraft, setAddressDraft] = useState<SavedAddress | null>(null);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressFeedback, setAddressFeedback] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [savingPreference, setSavingPreference] = useState<
    "orderUpdates" | "studioLetters" | null
  >(null);
  const [preferenceError, setPreferenceError] = useState<string | null>(null);

  const profile: Profile = profileOverride ?? {
    name: user?.name ?? user?.username ?? "Sana Ibrahim",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  };

  function startEditingProfile() {
    setProfileOverride(profile);
    setProfileFeedback(null);
    setProfileError(null);
    setEditingProfile(true);
  }

  function updateProfile(field: keyof Profile, value: string) {
    setProfileOverride({ ...profile, [field]: value });
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!csrfToken) {
      setProfileError("Your session expired. Sign in again to update your profile.");
      return;
    }
    setSavingProfile(true);
    setProfileError(null);
    setProfileFeedback(null);
    try {
      const response = await authenticatedRequest<{ user: NonNullable<typeof user> }>(
        "/auth/profile",
        csrfToken,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: profile.name,
            phone: profile.phone,
            ...(avatarDraft
              ? {
                  avatarUrl: avatarDraft.url,
                  avatarPublicId: avatarDraft.publicId,
                }
              : removeAvatar
                ? { avatarUrl: null, avatarPublicId: null }
                : {}),
          }),
        },
      );
      updateUser(response.user);
      setProfileOverride(null);
      setAvatarDraft(null);
      setRemoveAvatar(false);
      setEditingProfile(false);
      setProfileFeedback("Your personal details have been updated.");
    } catch (saveError) {
      setProfileError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save your profile. Please try again.",
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function uploadAvatar(file: File) {
    if (!csrfToken) {
      setProfileError("Your session expired. Sign in again to upload a photo.");
      return;
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024) {
      setProfileError("Choose a JPG, PNG, or WebP image up to 5 MB.");
      return;
    }
    setUploadingAvatar(true);
    setProfileError(null);
    try {
      const signed = await authenticatedRequest<{
        cloudName: string;
        apiKey: string;
        timestamp: number;
        folder: string;
        signature: string;
      }>("/auth/avatar/signature", csrfToken, { method: "POST" });
      const form = new FormData();
      form.set("file", file);
      form.set("api_key", signed.apiKey);
      form.set("timestamp", String(signed.timestamp));
      form.set("folder", signed.folder);
      form.set("signature", signed.signature);
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`,
        { method: "POST", body: form },
      );
      const result = (await response.json()) as {
        secure_url?: string;
        public_id?: string;
        error?: { message?: string };
      };
      if (!response.ok || !result.secure_url || !result.public_id)
        throw new Error(
          result.error?.message ?? "Cloudinary could not upload this image.",
        );
      setAvatarDraft({ url: result.secure_url, publicId: result.public_id });
      setRemoveAvatar(false);
    } catch (uploadError) {
      setProfileError(
        uploadError instanceof Error
          ? uploadError.message
          : "Image upload failed. Please try again.",
      );
    } finally {
      setUploadingAvatar(false);
    }
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void uploadAvatar(file);
    event.target.value = "";
  }

  function cancelProfileEdit() {
    setEditingProfile(false);
    setProfileOverride(null);
    setAvatarDraft(null);
    setRemoveAvatar(false);
    setProfileFeedback(null);
    setProfileError(null);
  }

  function startEditingAddress() {
    const savedAddress = user?.savedAddress;
    setAddressDraft({
      name: savedAddress?.name ?? user?.name ?? "",
      phone: savedAddress?.phone ?? user?.phone ?? "",
      governorate: savedAddress?.governorate ?? "",
      line1: savedAddress?.line1 ?? "",
      line2: savedAddress?.line2 ?? "",
      city: savedAddress?.city ?? "",
      postalCode: savedAddress?.postalCode ?? "",
      country: savedAddress?.country ?? "EG",
    });
    setAddressFeedback(null);
    setAddressError(null);
    setEditingAddress(true);
  }

  async function saveAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!csrfToken || !user || !addressDraft) {
      setAddressError("Your session expired. Sign in again to save your address.");
      return;
    }
    setSavingAddress(true);
    setAddressError(null);
    setAddressFeedback(null);
    try {
      const response = await authenticatedRequest<{ user: NonNullable<typeof user> }>(
        "/auth/profile",
        csrfToken,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: profile.name,
            phone: profile.phone,
            savedAddress: addressDraft,
          }),
        },
      );
      updateUser(response.user);
      setAddressDraft(null);
      setEditingAddress(false);
      setAddressFeedback("Your saved delivery address has been updated.");
    } catch (saveError) {
      setAddressError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save your address. Please try again.",
      );
    } finally {
      setSavingAddress(false);
    }
  }

  async function savePreference(
    preference: "orderUpdates" | "studioLetters",
    enabled: boolean,
  ) {
    if (!user || !csrfToken) {
      setPreferenceError("Your session expired. Sign in again to update preferences.");
      return;
    }
    setSavingPreference(preference);
    setPreferenceError(null);
    try {
      const response = await authenticatedRequest<{
        user: NonNullable<typeof user>;
      }>("/auth/profile", csrfToken, {
        method: "PATCH",
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          preferences: { [preference]: enabled },
        }),
      });
      updateUser(response.user);
      toast("Preferences saved", "Your account settings have been updated.");
    } catch (saveError) {
      setPreferenceError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save your preference. Please try again.",
      );
    } finally {
      setSavingPreference(null);
    }
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
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12">
        <nav
          aria-label="Account sections"
          className="flex gap-2 overflow-x-auto pb-1 lg:sticky lg:top-24 lg:h-fit lg:flex-col lg:overflow-visible"
        >
          {[
            { label: "Your orders", href: "#orders", icon: Package },
            { label: "Personal details", href: "#profile", icon: CircleUserRound },
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
                <Avatar className="size-12">
                  {!removeAvatar && (avatarDraft?.url || user.avatarUrl) && (
                    <AvatarImage
                      src={avatarDraft?.url ?? user.avatarUrl}
                      alt={`${profile.name} profile`}
                    />
                  )}
                  <AvatarFallback className="bg-clay/10 font-serif text-xl text-clay">
                    {profile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{profile.name}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {profile.email}
                  </p>
                </div>
                {editingProfile && (
                  <div className="ml-auto flex shrink-0 flex-wrap justify-end gap-2">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      aria-label="Choose profile photo"
                      onChange={handleAvatarChange}
                    />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar || savingProfile}
                      className="inline-flex h-9 items-center gap-2 rounded-full border border-border px-3 text-xs transition-colors hover:border-clay/50 disabled:opacity-50"
                    >
                      {uploadingAvatar ? (
                        <Upload className="size-3.5 animate-pulse" />
                      ) : (
                        <ImagePlus className="size-3.5" />
                      )}
                      {uploadingAvatar ? "Uploading…" : "Change photo"}
                    </button>
                    {(user.avatarUrl || avatarDraft) && !removeAvatar && (
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarDraft(null);
                          setRemoveAvatar(true);
                        }}
                        disabled={uploadingAvatar || savingProfile}
                        aria-label="Remove profile photo"
                        className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive disabled:opacity-50"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                )}
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
                />
                <ProfileField
                  label="Phone number"
                  type="tel"
                  value={profile.phone}
                  required={false}
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
              {profileError && (
                <p
                  role="alert"
                  className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs leading-5 text-destructive"
                >
                  {profileError}
                </p>
              )}
              {editingProfile && (
                <p className="mt-4 text-xs leading-5 text-muted-foreground">
                  Email changes are disabled because your email is used to sign
                  in. A verified email-change flow can be added separately.
                </p>
              )}
              {editingProfile && (
                <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-border pt-5">
                  <button
                    type="button"
                    onClick={cancelProfileEdit}
                    disabled={savingProfile || uploadingAvatar}
                    className="h-10 rounded-full px-4 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile || uploadingAvatar}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-xs text-background transition-colors hover:bg-clay disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Check className="size-3.5" />
                    {savingProfile ? "Saving…" : "Save details"}
                  </button>
                </div>
              )}
            </form>
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
                  onClick={startEditingAddress}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-xs transition-colors hover:border-clay/50"
                >
                  <PencilLine className="size-3.5" />
                  {user.savedAddress ? "Edit address" : "Add address"}
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
                {editingAddress && addressDraft ? (
                  <div className="grid min-w-0 flex-1 gap-5 sm:grid-cols-2">
                    <ProfileField
                      label="Recipient"
                      value={addressDraft.name}
                      editing
                      onChange={(name) =>
                        setAddressDraft({ ...addressDraft, name })
                      }
                    />
                    <ProfileField
                      label="Phone number"
                      type="tel"
                      value={addressDraft.phone}
                      editing
                      onChange={(phone) =>
                        setAddressDraft({ ...addressDraft, phone })
                      }
                    />
                    <ProfileField
                      label="Street address"
                      value={addressDraft.line1}
                      editing
                      onChange={(line1) =>
                        setAddressDraft({ ...addressDraft, line1 })
                      }
                    />
                    <ProfileField
                      label="Address details (optional)"
                      value={addressDraft.line2}
                      editing
                      required={false}
                      onChange={(line2) =>
                        setAddressDraft({ ...addressDraft, line2 })
                      }
                    />
                    <ProfileField
                      label="City"
                      value={addressDraft.city}
                      editing
                      onChange={(city) =>
                        setAddressDraft({ ...addressDraft, city })
                      }
                      required={false}
                    />
                    <ProfileField
                      label="Governorate"
                      value={addressDraft.governorate}
                      editing
                      onChange={(governorate) =>
                        setAddressDraft({ ...addressDraft, governorate })
                      }
                    />
                    <ProfileField
                      label="Postal code (optional)"
                      value={addressDraft.postalCode}
                      editing
                      required={false}
                      onChange={(postalCode) =>
                        setAddressDraft({ ...addressDraft, postalCode })
                      }
                    />
                  </div>
                ) : user.savedAddress ? (
                  <div className="grid min-w-0 flex-1 gap-5 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Recipient</p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {user.savedAddress.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Phone number
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {user.savedAddress.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Street address
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {[user.savedAddress.line1, user.savedAddress.line2]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">City</p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {[user.savedAddress.city, user.savedAddress.governorate]
                          .filter(Boolean)
                          .join(", ")}
                        {user.savedAddress.country
                          ? `, ${user.savedAddress.country === "EG" ? "Egypt" : user.savedAddress.country}`
                          : ""}
                      </p>
                    </div>
                    {user.savedAddress.postalCode && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Postal code
                        </p>
                        <p className="mt-2 text-sm font-medium text-foreground">
                          {user.savedAddress.postalCode}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="min-w-0 flex-1 py-1">
                    <p className="text-sm font-medium">No saved address yet</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Your delivery address from your first order will be saved
                      here for next time.
                    </p>
                  </div>
                )}
              </div>
              {addressFeedback && (
                <p
                  role="status"
                  className="mt-5 rounded-xl bg-secondary px-4 py-3 text-xs leading-5 text-muted-foreground"
                >
                  {addressFeedback}
                </p>
              )}
              {addressError && (
                <p
                  role="alert"
                  className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs leading-5 text-destructive"
                >
                  {addressError}
                </p>
              )}
              {editingAddress && (
                <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-border pt-5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAddress(false);
                      setAddressDraft(null);
                      setAddressError(null);
                    }}
                    disabled={savingAddress}
                    className="h-10 rounded-full px-4 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-xs text-background transition-colors hover:bg-clay disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Check className="size-3.5" />
                    {savingAddress ? "Saving…" : "Save address"}
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
                checked={user.preferences?.orderUpdates ?? false}
                disabled={savingPreference !== null}
                onChange={(checked) =>
                  void savePreference("orderUpdates", checked)
                }
                title="Order updates"
                description="A note when your order moves to its next step."
              />
              <PreferenceToggle
                checked={user.preferences?.studioLetters ?? false}
                disabled={savingPreference !== null}
                onChange={(checked) =>
                  void savePreference("studioLetters", checked)
                }
                title="Studio letters"
                description="New collections, maker stories, and considered living."
              />
              {preferenceError && (
                <p
                  role="alert"
                  className="py-3 text-xs leading-5 text-destructive"
                >
                  {preferenceError}
                </p>
              )}
              {savingPreference && (
                <p role="status" className="py-3 text-xs text-muted-foreground">
                  Saving preference…
                </p>
              )}
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
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-center gap-4 py-5 ${disabled ? "cursor-wait opacity-70" : "cursor-pointer"}`}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 shrink-0 accent-clay"
      />
    </label>
  );
}
