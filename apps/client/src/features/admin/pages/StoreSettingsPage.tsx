import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, MapPin, Paintbrush, Save, Store, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { authenticatedRequest, apiRequest } from "@/features/auth/auth-client";
import { useAuth } from "@/features/auth/useAuth";
import { useToast } from "@/features/toast/ToastProvider";

interface ShippingRate {
  governorate: string;
  price: number | null;
}

interface StoreSettings {
  storeName: string;
  contactEmail: string;
  phone: string;
  location: string;
  announcementEnabled: boolean;
  announcementText: string;
  shippingRates: ShippingRate[];
}

function StoreSettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-11 w-64 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      {[0, 1, 2].map((section) => (
        <Card key={section} className="rounded-md">
          <CardContent className="space-y-4 p-5">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function StoreSettingsPage() {
  const { csrfToken } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiRequest<StoreSettings>("/admin/settings")
      .then((result) => {
        if (!cancelled) setSettings(result);
      })
      .catch((loadError: unknown) => {
        if (!cancelled)
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load store settings.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [retry]);

  const configuredRates = useMemo(
    () =>
      settings?.shippingRates.filter((rate) => rate.price !== null).length ?? 0,
    [settings?.shippingRates],
  );

  function updateSettings(patch: Partial<StoreSettings>) {
    setSettings((current) => (current ? { ...current, ...patch } : current));
  }

  async function saveSettings() {
    if (!settings || !csrfToken) {
      setError("Your session is not ready. Refresh the page and try again.");
      return;
    }
    if (
      !settings.storeName.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.contactEmail.trim()) ||
      !settings.location.trim() ||
      (settings.announcementEnabled && !settings.announcementText.trim()) ||
      settings.shippingRates.some(
        ({ price }) =>
          price !== null &&
          (!Number.isSafeInteger(price) || price < 0 || price > 1_000_000),
      )
    ) {
      setError(
        "Check the store name, email, location, announcement, and whole-number delivery prices.",
      );
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await authenticatedRequest<StoreSettings>(
        "/admin/settings",
        csrfToken,
        { method: "PATCH", body: JSON.stringify(settings) },
      );
      setSettings(result);
      toast("Settings saved", "Your store settings are now up to date.");
    } catch (saveError: unknown) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Unable to save store settings.";
      setError(message);
      toast("Settings could not be saved", message);
    } finally {
      setSaving(false);
    }
  }

  if (loading && !settings) return <StoreSettingsSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Store settings"
        description="Manage your store profile, delivery prices, and storefront announcement."
        action={
          <Button
            onClick={() => void saveSettings()}
            disabled={saving || !settings}
            className="w-full sm:w-auto"
          >
            {saving ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save changes
          </Button>
        }
      />

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{error}</span>
          {!settings && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLoading(true);
                setError(null);
                setRetry((value) => value + 1);
              }}
            >
              Try again
            </Button>
          )}
        </div>
      )}

      {settings && (
        <>
          <Card className="gap-0 rounded-md border-0 py-0 shadow-none ring-1 ring-foreground/8">
            <CardHeader className="border-b border-border/70 px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Store className="size-4 text-clay" />
                Store profile
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Contact details appear in your storefront footer and customer
                communications.
              </p>
            </CardHeader>
            <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                Store name
                <Input
                  value={settings.storeName}
                  maxLength={80}
                  onChange={(event) =>
                    updateSettings({ storeName: event.target.value })
                  }
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Contact email
                <Input
                  type="email"
                  value={settings.contactEmail}
                  maxLength={254}
                  onChange={(event) =>
                    updateSettings({ contactEmail: event.target.value })
                  }
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Phone number
                <Input
                  type="tel"
                  value={settings.phone}
                  maxLength={30}
                  onChange={(event) =>
                    updateSettings({ phone: event.target.value })
                  }
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Store location
                <span className="relative block">
                  <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={settings.location}
                    maxLength={160}
                    className="pl-9"
                    onChange={(event) =>
                      updateSettings({ location: event.target.value })
                    }
                  />
                </span>
              </label>
            </CardContent>
          </Card>

          <Card className="gap-0 rounded-md border-0 py-0 shadow-none ring-1 ring-foreground/8">
            <CardHeader className="border-b border-border/70 px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="size-4 text-clay" />
                Delivery prices
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Set the cash-on-delivery shipping price for each governorate.
                Unconfigured prices cannot be used to place an order.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-secondary/60 px-4 py-3">
                <span className="text-sm font-medium">
                  {configuredRates} of {settings.shippingRates.length} prices set
                </span>
                <span className="text-xs text-muted-foreground">
                  Prices are in EGP · Origin: {settings.location}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {settings.shippingRates.map((rate, index) => (
                  <label
                    key={rate.governorate}
                    className="flex min-w-0 items-center justify-between gap-3 rounded-md border border-border/70 p-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {rate.governorate}
                      </span>
                    </span>
                    <span className="w-32 shrink-0">
                      <Input
                        type="number"
                        min="0"
                        max="1000000"
                        step="1"
                        inputMode="decimal"
                        aria-label={`${rate.governorate} shipping price in EGP`}
                        placeholder="Set price"
                        value={rate.price ?? ""}
                        onChange={(event) => {
                          const raw = event.target.value;
                          const price =
                            raw === "" ? null : Number.isFinite(Number(raw)) ? Number(raw) : null;
                          const shippingRates = [...settings.shippingRates];
                          shippingRates[index] = { ...rate, price };
                          updateSettings({ shippingRates });
                        }}
                        className="text-right"
                      />
                    </span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 rounded-md border-0 py-0 shadow-none ring-1 ring-foreground/8">
            <CardHeader className="border-b border-border/70 px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Paintbrush className="size-4 text-clay" />
                Storefront appearance
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Share a moving announcement above the storefront navigation.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <label className="flex items-center gap-3 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={settings.announcementEnabled}
                  onChange={(event) =>
                    updateSettings({
                      announcementEnabled: event.target.checked,
                    })
                  }
                  className="size-4 accent-clay"
                />
                Show announcement on storefront
              </label>
              <label className="block space-y-2 text-sm font-medium">
                Announcement message
                <textarea
                  value={settings.announcementText}
                  placeholder="For example: Complimentary delivery in Dakahlia"
                  rows={4}
                  onChange={(event) =>
                    updateSettings({ announcementText: event.target.value })
                  }
                  className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-6 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
                <span className="block text-xs font-normal text-muted-foreground">
                  No character limit. The announcement must have a message to
                  be enabled.
                </span>
              </label>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
