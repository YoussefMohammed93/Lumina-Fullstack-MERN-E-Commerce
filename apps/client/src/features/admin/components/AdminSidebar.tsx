import { LogOut, PanelLeftClose, PanelLeftOpen, Store, X } from "lucide-react";
import type { ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  adminNavigation,
  adminSettingsNavigation,
  adminWorkspaceNavigation,
} from "@/features/admin/admin-navigation";

interface AdminSidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCollapsedChange: () => void;
  onMobileClose: () => void;
  onLogout: () => void;
}
type NavigationItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
};

function NavigationGroup({
  items,
  pathname,
  collapsed,
  onNavigate,
}: {
  items: readonly NavigationItem[];
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <a
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex h-10 items-center gap-3 rounded-xl px-3 text-sm transition-colors",
              active
                ? "bg-sidebar-accent text-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            <Icon className="size-4 shrink-0" strokeWidth={1.6} />
            {!collapsed && <span>{item.label}</span>}
          </a>
        );
      })}
    </nav>
  );
}

function SidebarLinks({
  collapsed,
  onNavigate,
  onLogout,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  const pathname = window.location.pathname;
  return (
    <>
      <div className="mt-4 space-y-5">
        <NavigationGroup
          items={adminNavigation}
          pathname={pathname}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        <Separator className="bg-sidebar-border" />
        <NavigationGroup
          items={adminWorkspaceNavigation}
          pathname={pathname}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      </div>

      <div className="mt-auto space-y-3">
        <Separator className="bg-sidebar-border" />
        <NavigationGroup
          items={adminSettingsNavigation}
          pathname={pathname}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        <button
          type="button"
          onClick={onLogout}
          title={collapsed ? "Sign out" : undefined}
          className={cn(
            "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
            collapsed && "justify-center px-0",
          )}
        >
          <LogOut className="size-4 shrink-0" strokeWidth={1.6} />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </>
  );
}

export function AdminSidebar({
  collapsed,
  mobileOpen,
  onCollapsedChange,
  onMobileClose,
  onLogout,
}: AdminSidebarProps) {
  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden h-screen flex-col overflow-hidden border-r border-sidebar-border bg-sidebar px-3 py-5 transition-[width] duration-300 lg:flex",
          collapsed ? "w-[76px]" : "w-64",
        )}
      >
        <div
          className={cn(
            "flex items-center",
            collapsed ? "justify-center" : "justify-between px-2",
          )}
        >
          <a
            href="/"
            className="flex items-center gap-2.5"
            title="View storefront"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-foreground text-background">
              <Store className="size-4" strokeWidth={1.5} />
            </span>
            {!collapsed && (
              <span className="font-serif text-xl tracking-tight">Lumina</span>
            )}
          </a>
          {!collapsed && (
            <Button
              variant="ghost"
              size="default"
              onClick={onCollapsedChange}
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="size-4" />
            </Button>
          )}
        </div>
        {collapsed && (
          <Button
            className="mx-auto mt-6"
            variant="ghost"
            size="default"
            onClick={onCollapsedChange}
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="size-4" />
          </Button>
        )}
        <SidebarLinks collapsed={collapsed} onLogout={onLogout} />
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[1px] transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onMobileClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[290px] flex-col bg-sidebar px-4 py-5 shadow-xl transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-between px-1">
          <a href="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-foreground text-background">
              <Store className="size-4" strokeWidth={1.5} />
            </span>
            <span className="font-serif text-xl tracking-tight">Lumina</span>
          </a>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onMobileClose}
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </Button>
        </div>
        <SidebarLinks
          collapsed={false}
          onNavigate={onMobileClose}
          onLogout={onLogout}
        />
      </aside>
    </>
  );
}
