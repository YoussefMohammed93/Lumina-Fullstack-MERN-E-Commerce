import { Product } from "../models/product.model.js";
import type { IOrderItem } from "../models/order.model.js";

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
  try {
    for (const item of items) {
      const result = await Product.updateOne(
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
      );
      if (result.modifiedCount !== 1)
        throw new Error(
          "One or more products are no longer available in the requested quantity.",
        );
      reserved.push(item);
    }
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
