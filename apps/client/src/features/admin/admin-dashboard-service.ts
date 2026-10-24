export interface AdminDashboardOverview {
  paidRevenue: number;
  revenueByMonth: { label: string; amount: number }[];
  totalOrders: number;
  totalCustomers: number;
  productsSold: number;
  ordersToFulfill: number;
  lowStockProducts: number;
  failedPayments: number;
  newCustomers: number;
  recentOrders: {
    id: string;
    orderNumber: string;
    customer: string;
    itemCount: number;
    total: number;
    currency: string;
    paymentStatus: "pending" | "paid" | "awaiting_cod" | "failed";
    fulfillmentStatus:
      | "placed"
      | "confirmed"
      | "processing"
      | "shipped"
      | "out_for_delivery"
      | "delivered"
      | "cancelled";
  }[];
}
