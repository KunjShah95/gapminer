import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@gapminer/types";
import { getAuthToken, authFetch } from "@/lib/authFetch";

interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: "gapminer-auth" },
  ),
);

// Helper to initialize auth on app load
export async function initializeAuth() {
  const token = getAuthToken();
  if (!token) return false;

  try {
    const res = await authFetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/auth/me`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!res.ok) return false;

    const user = await res.json();
    useAuthStore.getState().setUser(user);
    useAuthStore.getState().setToken(token);
    return true;
  } catch {
    return false;
  }
}
