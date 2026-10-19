import { createContext } from "react";

export interface AuthUser {
  id: string;
  username: string;
  name?: string;
  email: string;
  role: "user" | "admin";
  avatarUrl?: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  csrfToken: string | null;
  openAuth: () => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
