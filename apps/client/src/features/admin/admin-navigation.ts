import {
  Bell,
  Archive,
  BookOpen,
  LayoutDashboard,
  Mail,
  Package,
  Settings,
  ShoppingBag,
  Tags,
  Trash2,
  Users,
} from "lucide-react";

export const adminNavigation = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Categories", href: "/admin/categories", icon: Tags },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Drafts", href: "/admin/drafts", icon: Archive },
  { label: "Trash", href: "/admin/trash", icon: Trash2 },
] as const;

export const adminWorkspaceNavigation = [
  { label: "Journal", href: "/admin/journal", icon: BookOpen },
  { label: "Newsletter", href: "/admin/newsletter", icon: Mail },
] as const;

export const adminSettingsNavigation = [
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Store settings", href: "/admin/settings", icon: Settings },
] as const;
