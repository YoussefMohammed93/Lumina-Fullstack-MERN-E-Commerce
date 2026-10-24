import { createContext } from "react";

export interface AuthSavedAddress {
  name?: string;
  phone?: string;
  governorate?: string;
  line1?: string;
  line2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export interface AuthUserPreferences {
  orderUpdates: boolean;
  studioLetters: boolean;
}

export interface AuthUser {
  id: string;
  username: string;
  name?: string;
  email: string;
  phone?: string;
  savedAddress?: AuthSavedAddress;
  preferences?: AuthUserPreferences;
  role: "user" | "admin";
  avatarUrl?: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  csrfToken: string | null;
  updateUser: (user: AuthUser) => void;
  openAuth: () => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
