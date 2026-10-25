import { apiRequest } from "@/features/auth/auth-client";

export interface PublicStoreSettings {
  storeName: string;
  contactEmail: string;
  phone: string;
  location: string;
  announcementEnabled: boolean;
  announcementText: string;
  shippingRates: { governorate: string; price: number | null }[];
}

export function fetchPublicStoreSettings() {
  return apiRequest<PublicStoreSettings>("/settings");
}
