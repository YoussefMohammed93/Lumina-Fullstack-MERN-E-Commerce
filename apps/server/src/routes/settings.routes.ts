import { Router } from "express";
import {
  EGYPT_GOVERNORATES,
  isEgyptGovernorate,
} from "../lib/governorates.js";
import { getStoreSettings } from "../lib/store-settings.js";
import { requireAuth, requireCsrf, requireRole } from "../middleware/auth.middleware.js";
import type { IShippingRate } from "../models/store-settings.model.js";
import { StoreSettings } from "../models/store-settings.model.js";

export const publicSettingsRouter = Router();
export const adminSettingsRouter = Router();

adminSettingsRouter.use(requireAuth, requireRole("admin"));

function validText(
  value: unknown,
  maxLength: number,
  options: { required?: boolean } = {},
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length <= maxLength &&
    (!options.required || value.trim().length > 0)
  );
}

function parseShippingRates(value: unknown): IShippingRate[] | null {
  if (!Array.isArray(value) || value.length !== EGYPT_GOVERNORATES.length)
    return null;

  const parsed: IShippingRate[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (
      !item ||
      typeof item !== "object" ||
      !("governorate" in item) ||
      !("price" in item)
    )
      return null;
    const rate = item as Record<string, unknown>;
    const governorate = rate.governorate;
    const price = rate.price;
    if (
      typeof governorate !== "string" ||
      !isEgyptGovernorate(governorate) ||
      seen.has(governorate) ||
      (price !== null &&
        (typeof price !== "number" ||
          !Number.isSafeInteger(price) ||
          price < 0 ||
          price > 1_000_000))
    )
      return null;
    seen.add(governorate);
    parsed.push({ governorate, price });
  }

  return seen.size === EGYPT_GOVERNORATES.length ? parsed : null;
}

publicSettingsRouter.get("/", async (_req, res, next) => {
  try {
    const settings = await getStoreSettings();
    res.json({
      success: true,
      data: {
        storeName: settings.storeName,
        contactEmail: settings.contactEmail,
        phone: settings.phone,
        location: settings.location,
        announcementEnabled: settings.announcementEnabled,
        announcementText: settings.announcementText,
        shippingRates: settings.shippingRates.map(({ governorate, price }) => ({
          governorate,
          price,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

adminSettingsRouter.get("/", async (_req, res, next) => {
  try {
    const settings = await getStoreSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

adminSettingsRouter.patch("/", requireCsrf, async (req, res, next) => {
  try {
    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    )
      return res.status(400).json({
        success: false,
        error: { message: "Check the store settings and delivery prices." },
      });
    const body = req.body as Record<string, unknown>;
    const shippingRates = parseShippingRates(body.shippingRates);
    const contactEmail =
      typeof body.contactEmail === "string" ? body.contactEmail.trim() : "";

    if (
      !validText(body.storeName, 80, { required: true }) ||
      !validText(body.contactEmail, 254, { required: true }) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) ||
      !validText(body.phone, 30) ||
      !validText(body.location, 160, { required: true }) ||
      typeof body.announcementEnabled !== "boolean" ||
      typeof body.announcementText !== "string" ||
      (body.announcementEnabled && !body.announcementText.trim()) ||
      !shippingRates
    )
      return res.status(400).json({
        success: false,
        error: { message: "Check the store settings and delivery prices." },
      });

    const settings = await StoreSettings.findOneAndUpdate(
      { key: "store" },
      {
        $set: {
          storeName: body.storeName.trim(),
          contactEmail,
          phone: body.phone.trim(),
          location: body.location.trim(),
          announcementEnabled: body.announcementEnabled,
          announcementText: body.announcementText.trim(),
          shippingRates,
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );

    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});
