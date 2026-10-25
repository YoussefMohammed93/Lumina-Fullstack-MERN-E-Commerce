import { useEffect, useState } from "react";
import { apiRequest } from "@/features/auth/auth-client";
import { useAuth } from "@/features/auth/useAuth";
import { AdminSidebar } from "@/features/admin/components/AdminSidebar";
import { BrandLoadingScreen } from "@/components/BrandLogo";
import { AdminTopbar } from "@/features/admin/components/AdminTopbar";
import { DashboardPage } from "@/features/admin/pages/DashboardPage";
import { ResourcePage } from "@/features/admin/pages/ResourcePage";
import { ProductsPage } from "@/features/admin/pages/ProductsPage";
import { ProductTrashPage } from "@/features/admin/pages/ProductTrashPage";
import { ProductRecycleBinPage } from "@/features/admin/pages/ProductRecycleBinPage";
import { CustomersPage } from "@/features/admin/pages/CustomersPage";
import { CategoriesPage } from "@/features/admin/pages/CategoriesPage";
import { OrdersPage } from "@/features/admin/pages/OrdersPage";
import { NotificationsPage } from "@/features/admin/pages/NotificationsPage";
import { JournalAdminPage } from "@/features/admin/pages/JournalAdminPage";
import { NewsletterPage } from "@/features/admin/pages/NewsletterPage";
import { AdminNotificationsProvider } from "@/features/admin/notifications/admin-notifications-context";
import type { Product } from "@/types/product";
import type { AdminDashboardOverview } from "@/features/admin/admin-dashboard-service";

export function AdminDashboard({ products }: { products: Product[] }) {
  const { user, loading, openAuth, logout } = useAuth();
  const [overview, setOverview] = useState<AdminDashboardOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [overviewRetry, setOverviewRetry] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (user?.role !== "admin") return;
    let cancelled = false;
    void apiRequest<AdminDashboardOverview>("/admin/dashboard/overview")
      .then((data) => {
        if (!cancelled) {
          setOverview(data);
          setOverviewError(null);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setOverviewError(
            error instanceof Error
              ? error.message
              : "Unable to load dashboard overview.",
          );
      })
      .finally(() => {
        if (!cancelled) setOverviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [overviewRetry, user?.role]);

  if (loading) return <BrandLoadingScreen label="Preparing your workspace" />;
  if (!user)
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-4xl">Sign in required</h1>
        <button
          type="button"
          onClick={openAuth}
          className="rounded-xl bg-foreground px-5 py-3 text-sm text-background"
        >
          Sign in
        </button>
      </main>
    );
  if (user.role !== "admin")
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="eyebrow text-clay">403</p>
        <h1 className="text-4xl">Admin access only</h1>
        <a href="/" className="mt-3 text-sm underline underline-offset-4">
          Return to the store
        </a>
      </main>
    );

  const page = window.location.pathname.split("/")[2];
  return (
    <AdminNotificationsProvider>
      <div className="min-h-screen bg-background">
        <AdminSidebar
          collapsed={collapsed}
          mobileOpen={mobileSidebarOpen}
          onCollapsedChange={() => setCollapsed((value) => !value)}
          onMobileClose={() => setMobileSidebarOpen(false)}
          onLogout={() => void logout()}
        />
        <div
          className={`min-w-0 transition-[padding] duration-300 ${
            collapsed ? "lg:pl-[76px]" : "lg:pl-64"
          }`}
        >
          <AdminTopbar
            user={user}
            collapsed={collapsed}
            onMenuClick={() => setMobileSidebarOpen(true)}
            onLogout={() => void logout()}
          />
          <main className="mx-auto px-4 pt-25 pb-7 md:px-7 md:pt-27 md:pb-9">
            {page === "products" ? (
              <ProductsPage />
            ) : page === "journal" ? (
              <JournalAdminPage />
            ) : page === "newsletter" ? (
              <NewsletterPage />
            ) : page === "orders" ? (
              <OrdersPage products={products} />
            ) : page === "notifications" ? (
              <NotificationsPage />
            ) : page === "categories" ? (
              <CategoriesPage />
            ) : page === "customers" ? (
              <CustomersPage />
            ) : page === "drafts" ? (
              <ProductTrashPage />
            ) : page === "trash" ? (
              <ProductRecycleBinPage />
            ) : page ? (
              <ResourcePage page={page} />
            ) : (
              <DashboardPage
                userName={user.name || user.username}
                overview={overview}
                loading={overviewLoading}
                error={overviewError}
                onRetry={() => {
                  setOverviewLoading(true);
                  setOverviewRetry((value) => value + 1);
                }}
              />
            )}
          </main>
        </div>
      </div>
    </AdminNotificationsProvider>
  );
}
