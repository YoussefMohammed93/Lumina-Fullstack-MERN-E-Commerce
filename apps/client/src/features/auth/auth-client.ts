type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: { message?: string };
};

import { API_BASE } from "@/lib/api-base";

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}/api/v1${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });

  const body = (await response.json().catch(() => ({}))) as ApiEnvelope<T>;

  if (!response.ok)
    throw new Error(body.error?.message ?? "Something went wrong.");
  return body.data as T;
}

export function authenticatedRequest<T>(
  path: string,
  csrfToken: string,
  init: RequestInit = {},
): Promise<T> {
  return apiRequest<T>(path, {
    ...init,
    headers: { "x-csrf-token": csrfToken, ...(init.headers ?? {}) },
  });
}
