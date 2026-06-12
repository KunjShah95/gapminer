import { create } from "zustand";
import { getAuthToken } from "@/lib/authFetch";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "analysis_complete" | "resume_parsed" | "system" | "reminder";
  read: boolean;
  link?: string;
  created_at: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  dropdownOpen: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  setDropdownOpen: (open: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  dropdownOpen: false,

  fetchNotifications: async () => {
    const token = getAuthToken();
    if (!token) return;
    set({ loading: true });
    try {
      const res = await fetch("/api/v1/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        set({
          notifications: data.notifications || data || [],
          unreadCount: (data.notifications || data || []).filter(
            (n: Notification) => !n.read,
          ).length,
        });
      }
    } catch {
      // silent
    } finally {
      set({ loading: false });
    }
  },

  markAsRead: async (id: string) => {
    const token = getAuthToken();
    if (!token) return;
    try {
      await fetch(`/api/v1/notifications/${id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {
      // silent
    }
  },

  markAllAsRead: async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      await fetch("/api/v1/notifications/read-all", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch {
      // silent
    }
  },

  setDropdownOpen: (open) => set({ dropdownOpen: open }),
}));
