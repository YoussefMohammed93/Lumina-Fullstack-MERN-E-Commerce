import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  apiRequest,
  authenticatedRequest,
} from "@/features/auth/auth-client";
import { useAuth } from "@/features/auth/useAuth";
import type { AdminNotificationType } from "./notification-utils";

export interface AdminNotification {
  id: string;
  type: AdminNotificationType;
  title: string;
  message: string;
  href: string;
  createdAt: string;
  isRead: boolean;
}

interface NotificationResponse {
  notifications: AdminNotification[];
  unreadCount: number;
}

interface AdminNotificationsContextValue {
  notifications: AdminNotification[];
  unreadCount: number;
  version: number;
  error: string | null;
  refresh: () => Promise<void>;
  markRead: (id: string, read: boolean) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const AdminNotificationsContext =
  createContext<AdminNotificationsContextValue | null>(null);

export function AdminNotificationsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { csrfToken } = useAuth();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [version, setVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await apiRequest<NotificationResponse>(
        "/admin/notifications?limit=5",
      );
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
      setError(null);
      setVersion((current) => current + 1);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to load notifications.";
      setError(message);
      throw requestError;
    }
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        await refresh();
      } catch {
        if (!active) return;
      }
    };
    void load();
    const interval = window.setInterval(() => void load(), 15_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [refresh]);

  const markRead = useCallback(
    async (id: string, read: boolean) => {
      if (!csrfToken) throw new Error("Sign in again to update notifications.");
      try {
        await authenticatedRequest(
          `/admin/notifications/${encodeURIComponent(id)}/read`,
          csrfToken,
          {
            method: "PATCH",
            body: JSON.stringify({ read }),
          },
        );
        await refresh();
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to update notifications.",
        );
        throw requestError;
      }
    },
    [csrfToken, refresh],
  );

  const markAllRead = useCallback(async () => {
    if (!csrfToken) throw new Error("Sign in again to update notifications.");
    try {
      await authenticatedRequest(
        "/admin/notifications/read-all",
        csrfToken,
        { method: "PATCH" },
      );
      await refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update notifications.",
      );
      throw requestError;
    }
  }, [csrfToken, refresh]);

  return (
    <AdminNotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        version,
        error,
        refresh,
        markRead,
        markAllRead,
      }}
    >
      {children}
    </AdminNotificationsContext.Provider>
  );
}

// The hook is intentionally colocated with its private context.
// eslint-disable-next-line react-refresh/only-export-components
export function useAdminNotifications() {
  const context = useContext(AdminNotificationsContext);
  if (!context)
    throw new Error(
      "useAdminNotifications must be used within AdminNotificationsProvider.",
    );
  return context;
}
