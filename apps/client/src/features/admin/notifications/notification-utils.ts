export type AdminNotificationType =
  | "new_order"
  | "order_status"
  | "low_stock"
  | "new_customer";

export function notificationTimeLabel(value: string): string {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 60_000),
  );
  if (minutes < 1) return "Now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Intl.DateTimeFormat("en-EG", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function isAdminNotificationType(
  value: string,
): value is AdminNotificationType {
  return (
    value === "new_order" ||
    value === "order_status" ||
    value === "low_stock" ||
    value === "new_customer"
  );
}
