import { useEffect, useState } from "react";
import { apiRequest } from "@/features/auth/auth-client";
import { useAuth } from "@/features/auth/useAuth";
import { AdminSidebar } from "@/features/admin/components/AdminSidebar";
import { AdminTopbar } from "@/features/admin/components/AdminTopbar";
import { DashboardPage } from "@/features/admin/pages/DashboardPage";
import { ResourcePage } from "@/features/admin/pages/ResourcePage";
import { ProductsPage } from "@/features/admin/pages/ProductsPage";
import { ProductTrashPage } from "@/features/admin/pages/ProductTrashPage";
import { ProductRecycleBinPage } from "@/features/admin/pages/ProductRecycleBinPage";

export function AdminDashboard() {
  const { user, loading, openAuth, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (user?.role === "admin")
      apiRequest("/admin/dashboard/overview").catch(() => undefined);
  }, [user?.role]);

  if (loading) return null;
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
          ) : page === "drafts" ? (
            <ProductTrashPage />
          ) : page === "trash" ? (
            <ProductRecycleBinPage />
          ) : page ? (
            <ResourcePage page={page} />
          ) : (
            <DashboardPage userName={user.name || user.username} />
          )}
        </main>
      </div>
    </div>
  );
}
