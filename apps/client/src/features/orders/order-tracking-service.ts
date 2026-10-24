import { apiRequest } from "@/features/auth/auth-client";

export const ORDER_STAGES = [
  { key: "placed", label: "Order Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
] as const;

export type OrderStage = (typeof ORDER_STAGES)[number]["key"] | "cancelled";

interface OrderApiItem {
  productId: string;
  variantId: string;
  sku: string;
  attributes: Record<string, string>;
  name: string;
  unitAmount: number;
  quantity: number;
}

interface OrderApiResponse {
  id: string;
  orderNumber: string;
  placedAt: string;
  estimatedDelivery: string;
  currentStage: OrderStage;
  timeline: { status: OrderStage; at: string }[];
  items: OrderApiItem[];
  amountTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  shipping: {
    name: string;
    phone: string;
    address: string[];
  };
  shippingAmount: number;
}

interface OrdersResponse {
  orders: OrderApiResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pageCount: number;
  };
}

export interface TrackingOrder {
  id: string;
  orderNumber: string;
  placedAt: string;
  estimatedDelivery: string;
  currentStage: OrderStage;
  timeline: Record<OrderStage, string | null>;
  items: {
    productId: string;
    variantId: string;
    name: string;
    variant: string;
    quantity: number;
    unitAmount: number;
  }[];
  amountTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  shipping: {
    name: string;
    phone: string;
    address: string[];
  };
  shippingAmount: number;
}

export interface OrderTrackingService {
  listOrders(): Promise<TrackingOrder[]>;
  getOrder(orderId: string): Promise<TrackingOrder | undefined>;
}

function presentOrder(order: OrderApiResponse): TrackingOrder {
  const timeline = Object.fromEntries(
    [
      ...ORDER_STAGES.map((stage) => stage.key),
      "cancelled",
    ].map((stage) => [stage, null]),
  ) as Record<OrderStage, string | null>;

  for (const entry of order.timeline) timeline[entry.status] = entry.at;

  return {
    ...order,
    timeline,
    items: order.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      name: item.name,
      variant:
        Object.values(item.attributes).filter(Boolean).join(" · ") || item.sku,
      quantity: item.quantity,
      unitAmount: item.unitAmount,
    })),
  };
}

async function listOrders(): Promise<TrackingOrder[]> {
  const pageSize = 100;
  const result: TrackingOrder[] = [];
  let page = 1;

  while (true) {
    const response = await apiRequest<OrdersResponse>(
      `/orders?page=${page}&limit=${pageSize}`,
    );
    result.push(...response.orders.map(presentOrder));
    if (page >= response.pagination.pageCount) break;
    page += 1;
  }

  return result;
}

async function getOrder(orderId: string): Promise<TrackingOrder | undefined> {
  const response = await apiRequest<{ order: OrderApiResponse }>(
    `/orders/${encodeURIComponent(orderId)}`,
  );
  return presentOrder(response.order);
}

export const orderTrackingService: OrderTrackingService = {
  listOrders,
  getOrder,
};
