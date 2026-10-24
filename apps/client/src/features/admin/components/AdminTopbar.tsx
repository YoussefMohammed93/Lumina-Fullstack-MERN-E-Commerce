import type { MouseEvent } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  LogOut,
  Menu,
  PackageCheck,
  Search,
  Settings,
  ShoppingBag,
  UserRoundPlus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { AuthUser } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils";
import { useAdminNotifications } from "@/features/admin/notifications/admin-notifications-context";
import { notificationTimeLabel } from "@/features/admin/notifications/notification-utils";

export function AdminTopbar({
  user,
  collapsed,
  onMenuClick,
  onLogout,
}: {
  user: AuthUser;
  collapsed: boolean;
  onMenuClick: () => void;
  onLogout: () => void;
}) {
  const initials = (user.name || user.username).slice(0, 2).toUpperCase();
  const displayName = user.name || user.username;
  const {
    notifications,
    unreadCount,
    error: notificationError,
    markRead,
    markAllRead,
  } = useAdminNotifications();
  const notificationIcon = {
    new_order: {
      icon: ShoppingBag,
      className: "bg-blue-100 text-blue-700",
    },
    order_status: {
      icon: PackageCheck,
      className: "bg-emerald-100 text-emerald-700",
    },
    low_stock: {
      icon: AlertTriangle,
      className: "bg-rose-100 text-rose-700",
    },
    new_customer: {
      icon: UserRoundPlus,
      className: "bg-violet-100 text-violet-700",
    },
  } as const;
  async function openNotification(
    event: MouseEvent<HTMLAnchorElement>,
    notification: (typeof notifications)[number],
  ) {
    event.preventDefault();
    try {
      if (!notification.isRead) await markRead(notification.id, true);
      window.location.assign(notification.href);
    } catch {
      return;
    }
  }
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-20 flex h-18 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur md:px-7 lg:left-64",
        collapsed && "lg:left-[76px]",
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open navigation"
        onClick={onMenuClick}
      >
        <Menu />
      </Button>
      <div className="relative min-w-0 flex-1 sm:max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-9 w-full rounded-xl border-transparent bg-muted pl-9 text-sm shadow-none placeholder:text-xs focus-visible:bg-card sm:placeholder:text-sm"
          placeholder="Search orders, products…"
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="default"
              className="relative h-9 w-9 rounded-full p-0"
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
            >
              <Bell className="size-6" strokeWidth={1.6} />
              {unreadCount > 0 && (
                <span className="absolute -top-0 -right-0 grid min-h-4 min-w-4 place-items-center rounded-full bg-clay px-1 text-[9px] font-semibold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="max-w-[calc(100vw-2rem)] rounded-md p-0"
            style={{ width: "min(352px, calc(100vw - 2rem))" }}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-serif text-lg">Notifications</p>
                <p className="text-xs text-muted-foreground">
                  {unreadCount
                    ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`
                    : "You're all caught up"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 rounded-lg text-xs font-semibold text-clay"
                onClick={() => void markAllRead().catch(() => undefined)}
                disabled={!unreadCount}
              >
                <CheckCheck className="size-3.5" />
                Mark all read
              </Button>
            </div>
            {notificationError && (
              <p role="alert" className="px-4 pb-2 text-xs text-destructive">
                {notificationError}
              </p>
            )}
            {notifications.length ? (
              notifications.map((notification) => {
                const { icon: Icon, className } =
                  notificationIcon[notification.type];
                return (
                  <DropdownMenuItem
                    key={notification.id}
                    asChild
                    className="rounded-none p-0 focus:bg-muted"
                  >
                    <a
                      href={notification.href}
                      onClick={(event) =>
                        void openNotification(event, notification)
                      }
                      className="flex w-full items-start gap-3 px-4 py-3"
                    >
                      <span
                        className={`grid size-9 shrink-0 place-items-center rounded-full ${className}`}
                      >
                        <Icon className="size-4" strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              "text-sm",
                              !notification.isRead && "font-semibold",
                            )}
                          >
                            {notification.title}
                          </span>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {notificationTimeLabel(notification.createdAt)}
                          </span>
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {notification.message}
                        </span>
                      </span>
                      {!notification.isRead && (
                        <span className="mt-2 size-2 shrink-0 rounded-full bg-clay" />
                      )}
                    </a>
                  </DropdownMenuItem>
                );
              })
            ) : (
              <p className="px-4 py-5 text-center text-sm text-muted-foreground">
                No notifications yet.
              </p>
            )}
            <DropdownMenuItem
              asChild
              className="justify-center rounded-none py-3 font-semibold text-clay focus:bg-muted"
            >
              <a href="/admin/notifications">View all notifications</a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="ml-1 hidden items-center gap-2.5 sm:flex">
          <div className="text-right">
            <p className="text-xs font-semibold">{displayName}</p>
            <p className="text-[11px] text-muted-foreground">Administrator</p>
          </div>
          <Avatar size="default">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="block rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring sm:hidden"
              aria-label="Open account menu"
            >
              <Avatar size="default">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={10}
            className="w-64 rounded-xl p-2 sm:hidden"
          >
            <DropdownMenuLabel className="px-2 py-2">
              <div className="flex items-center gap-3">
                <Avatar>
                  {user.avatarUrl && (
                    <AvatarImage src={user.avatarUrl} alt="" />
                  )}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {displayName}
                  </p>
                  <p className="truncate text-xs font-normal text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="gap-2 py-2">
              <a href="/admin/settings">
                <Settings className="size-4" />
                Store settings
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="gap-2 py-2"
              onSelect={() => void onLogout()}
            >
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
