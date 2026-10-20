import {
  BarChart3,
  Bell,
  Boxes,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
  Tags,
  Users,
} from "lucide-react";

export const adminNavigation = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Categories", href: "/admin/categories", icon: Tags },
  { label: "Customers", href: "/admin/customers", icon: Users },
] as const;

export const adminWorkspaceNavigation = [
  { label: "Inventory", href: "/admin/inventory", icon: Boxes },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Content", href: "/admin/content", icon: FileText },
] as const;

export const adminSettingsNavigation = [
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Store settings", href: "/admin/settings", icon: Settings },
] as const;
