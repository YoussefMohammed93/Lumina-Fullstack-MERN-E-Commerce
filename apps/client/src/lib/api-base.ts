// Base URL for API calls.
// In production, VITE_API_URL points to the deployed backend (e.g. https://mern-ecommerce-api.vercel.app).
// In development, it's empty so requests go through the Vite proxy.
export const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
