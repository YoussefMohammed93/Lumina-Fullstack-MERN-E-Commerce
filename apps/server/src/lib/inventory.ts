import { Product } from "../models/product.model.js";
import type { IOrderItem } from "../models/order.model.js";
import { randomUUID } from "node:crypto";
import { notifyLowStock } from "./notifications.js";

export const LOW_STOCK_THRESHOLD = 5;

export interface InventoryReservationItem {
  productId: string;
  variantId: string;
  quantity: number;
}

export function inventoryForOrderItems(
  items: Pick<IOrderItem, "productId" | "variantId" | "quantity">[],
): InventoryReservationItem[] {
  return items.map(({ productId, variantId, quantity }) => ({
    productId,
    variantId,
    quantity,
  }));
}

export async function reserveInventory(
  items: InventoryReservationItem[],
): Promise<void> {
  const reserved: InventoryReservationItem[] = [];
  const lowStockEvents: Array<{
    eventKey: string;
    productName: string;
    sku: string;
    stock: number;
  }> = [];
  try {
    for (const item of items) {
      const product = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          variants: {
            $elemMatch: {
              _id: item.variantId,
              isActive: true,
              stock: { $gte: item.quantity },
            },
          },
        },
        { $inc: { "variants.$.stock": -item.quantity } },
        {
          new: false,
          projection: { name: 1, "variants.$": 1 },
        },
      ).lean();
      if (!product)
        throw new Error(
          "One or more products are no longer available in the requested quantity.",
        );
      reserved.push(item);

      const variant = product.variants[0];
      if (!variant)
        throw new Error(
          `Reserved variant ${item.variantId} could not be read for product ${item.productId}.`,
        );
      const remainingStock = variant.stock - item.quantity;
      if (variant.stock > LOW_STOCK_THRESHOLD && remainingStock <= LOW_STOCK_THRESHOLD)
        lowStockEvents.push({
          eventKey: `low-stock:${item.productId}:${item.variantId}:${randomUUID()}`,
          productName: product.name,
          sku: variant.sku,
          stock: remainingStock,
        });
    }
    await Promise.all(lowStockEvents.map((event) => notifyLowStock(event)));
  } catch (error) {
    await restoreInventory(reserved);
    throw error;
  }
}

export async function restoreInventory(
  items: InventoryReservationItem[],
): Promise<void> {
  for (const item of items) {
    const result = await Product.updateOne(
      { _id: item.productId, "variants._id": item.variantId },
      { $inc: { "variants.$.stock": item.quantity } },
    );
    if (result.matchedCount !== 1)
      throw new Error(
        `Unable to restore inventory for product ${item.productId}, variant ${item.variantId}.`,
      );
  }
}
