export const ORDER_STAGES = [
  { key: "placed", label: "Order Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
] as const;

export type OrderStage = (typeof ORDER_STAGES)[number]["key"];

export interface TrackingOrder {
  id: string;
  orderNumber: string;
  placedAt: string;
  estimatedDelivery: string;
  currentStage: OrderStage;
  timeline: Record<OrderStage, string | null>;
  items: {
    name: string;
    variant: string;
    quantity: number;
    unitAmount: number;
  }[];
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

const mockOrders: TrackingOrder[] = [
  {
    id: "lum-2026-1048",
    orderNumber: "LM-1048",
    placedAt: "2026-10-20T10:32:00",
    estimatedDelivery: "2026-10-24T00:00:00",
    currentStage: "out_for_delivery",
    timeline: {
      placed: "2026-10-20T10:32:00",
      confirmed: "2026-10-20T11:05:00",
      processing: "2026-10-21T13:40:00",
      shipped: "2026-10-22T09:15:00",
      out_for_delivery: "2026-10-24T08:30:00",
      delivered: null,
    },
    items: [
      {
        name: "Sculpted Ceramic Vase",
        variant: "Warm ivory · Medium",
        quantity: 1,
        unitAmount: 84500,
      },
      {
        name: "Linen Cushion Cover",
        variant: "Natural flax · 50 × 50 cm",
        quantity: 2,
        unitAmount: 32500,
      },
    ],
    paymentMethod: "Card · Visa ending in 4242",
    paymentStatus: "Paid",
    shipping: {
      name: "Sana Ibrahim",
      phone: "+20 100 123 4567",
      address: ["18 Road 9, Maadi", "Cairo, Egypt"],
    },
    shippingAmount: 0,
  },
  {
    id: "lum-2026-1031",
    orderNumber: "LM-1031",
    placedAt: "2026-10-17T14:18:00",
    estimatedDelivery: "2026-10-21T00:00:00",
    currentStage: "delivered",
    timeline: {
      placed: "2026-10-17T14:18:00",
      confirmed: "2026-10-17T14:27:00",
      processing: "2026-10-18T09:10:00",
      shipped: "2026-10-19T11:42:00",
      out_for_delivery: "2026-10-21T08:06:00",
      delivered: "2026-10-21T13:24:00",
    },
    items: [
      {
        name: "Handwoven Table Runner",
        variant: "Oatmeal · 180 cm",
        quantity: 1,
        unitAmount: 59000,
      },
    ],
    paymentMethod: "Cash on delivery",
    paymentStatus: "Collected",
    shipping: {
      name: "Sana Ibrahim",
      phone: "+20 100 123 4567",
      address: ["18 Road 9, Maadi", "Cairo, Egypt"],
    },
    shippingAmount: 5000,
  },
  {
    id: "lum-2026-1012",
    orderNumber: "LM-1012",
    placedAt: "2026-10-14T09:05:00",
    estimatedDelivery: "2026-10-19T00:00:00",
    currentStage: "processing",
    timeline: {
      placed: "2026-10-14T09:05:00",
      confirmed: "2026-10-14T09:12:00",
      processing: "2026-10-15T10:25:00",
      shipped: null,
      out_for_delivery: null,
      delivered: null,
    },
    items: [
      {
        name: "Ribbed Glass Carafe",
        variant: "Smoke grey · 1.2 L",
        quantity: 1,
        unitAmount: 42000,
      },
    ],
    paymentMethod: "Card · Mastercard ending in 1088",
    paymentStatus: "Paid",
    shipping: {
      name: "Sana Ibrahim",
      phone: "+20 100 123 4567",
      address: ["18 Road 9, Maadi", "Cairo, Egypt"],
    },
    shippingAmount: 0,
  },
];

export const orderTrackingService: OrderTrackingService = {
  async listOrders() {
    return mockOrders;
  },
  async getOrder(orderId) {
    return mockOrders.find((order) => order.id === orderId);
  },
};
