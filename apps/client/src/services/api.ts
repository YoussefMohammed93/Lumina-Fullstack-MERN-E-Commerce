import type { ProductsApiResponse, Product } from '../types/product';

const API_BASE_URL = 'http://localhost:5000/api/v1';

export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch('/api/v1/products');
    if (res.ok) {
      const data: ProductsApiResponse = await res.json();
      return data.data;
    }
  } catch {
    // If proxy is not configured or in different host, fallback to direct API
  }

  const res = await fetch(`${API_BASE_URL}/products`);
  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.status} ${res.statusText}`);
  }
  const data: ProductsApiResponse = await res.json();
  return data.data;
}
