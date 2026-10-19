export interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  cashOnDeliveryAvailable: boolean;
}

// Temporary server-side catalogue. Checkout must never use a price sent by the browser.
export const catalog: CatalogProduct[] = [
  ["prod-clay-01", "Bouclé Lounge Chair", 1290, 8, false],
  ["prod-clay-02", "Stoneware Pour-Over Set", 148, 42, true],
  ["prod-clay-03", "Linen Table Runner", 96, 61, true],
  ["prod-clay-04", "Halo Table Lamp", 340, 17, false],
  ["prod-clay-05", "Hand-Blown Carafe", 78, 120, true],
  ["prod-clay-06", "Oak Floating Shelf", 265, 24, true],
  ["prod-clay-07", "Pleated Pendant", 410, 12, false],
  ["prod-clay-08", "Ribbed Stone Vase", 190, 30, true],
  ["prod-clay-09", "Woven Wool Throw", 220, 36, true],
  ["prod-clay-10", "Brass Candle Holders", 135, 48, true],
  ["prod-clay-11", "Cane Dining Chair", 380, 40, false],
  ["prod-clay-12", "Alabaster Wall Sconce", 520, 6, false],
].map(([id, name, price, stock, cashOnDeliveryAvailable]) => ({
  id: id as string,
  name: name as string,
  price: price as number,
  stock: stock as number,
  cashOnDeliveryAvailable: cashOnDeliveryAvailable as boolean,
}));

export const catalogById = new Map(
  catalog.map((product) => [product.id, product]),
);
