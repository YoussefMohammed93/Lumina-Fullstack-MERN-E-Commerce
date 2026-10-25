import { EGYPT_GOVERNORATES } from "./governorates.js";
import { StoreSettings } from "../models/store-settings.model.js";

export function getStoreSettings() {
  return StoreSettings.findOneAndUpdate(
    { key: "store" },
    {
      $setOnInsert: {
        key: "store",
        storeName: "Lumina",
        contactEmail: "lumina@gmail.com",
        phone: "",
        location: "Mansoura, Dakahlia, Egypt",
        announcementEnabled: false,
        announcementText: "",
        shippingRates: EGYPT_GOVERNORATES.map((governorate) => ({
          governorate,
          price: null,
        })),
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}
