import { create } from 'zustand';
import * as notificationsApi from '../api/notifications.api';
import type { NotificationDto } from '../types/models';

interface NotificationsState {
  items: NotificationDto[];
  unreadCount: number;
  loading: boolean;
  fetch: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  add: (notification: NotificationDto) => void;
}

function countUnread(items: NotificationDto[]): number {
  return items.filter((n) => !n.read).length;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: [],
  unreadCount: 0,
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const items = await notificationsApi.listNotifications();
      set({ items, unreadCount: countUnread(items), loading: false });
    } catch {
      set({ loading: false });
    }
  },

  markRead: async (id) => {
    const updated = await notificationsApi.markNotificationRead(id);
    const items = get().items.map((n) => (n.id === id ? updated : n));
    set({ items, unreadCount: countUnread(items) });
  },

  markAllRead: async () => {
    await notificationsApi.markAllNotificationsRead();
    const items = get().items.map((n) => ({ ...n, read: true }));
    set({ items, unreadCount: 0 });
  },

  add: (notification) => {
    const items = [notification, ...get().items];
    set({ items, unreadCount: countUnread(items) });
  },
}));
