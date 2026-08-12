import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/auth.store';
import { useSocketStore } from '../stores/socket.store';
import { useRequestsStore } from '../stores/requests.store';
import { useUsersStore } from '../stores/users.store';
import { useNotificationsStore } from '../stores/notifications.store';
import { useDashboardStore } from '../stores/dashboard.store';
import type { NotificationDto, UserDto } from '../types/models';

// Owns the socket.io-client lifecycle for the whole app. Mounted once near
// the root; only connects while a token is present. Route changes must NOT
// tear the socket down, so the current pathname is read through a ref inside
// the event handlers rather than being an effect dependency.
export function useSocket(): void {
  const token = useAuthStore((s) => s.token);
  const connect = useSocketStore((s) => s.connect);
  const disconnect = useSocketStore((s) => s.disconnect);
  const location = useLocation();
  const pathnameRef = useRef(location.pathname);
  pathnameRef.current = location.pathname;

  useEffect(() => {
    if (!token) return;

    const socket = connect(token);

    const handleNotification = (notification: NotificationDto) => {
      useNotificationsStore.getState().add(notification);
      toast(notification.message, { icon: '🔔' });
    };
    const handleRequestEvent = () => {
      useRequestsStore.getState().refreshCurrent();
      if (pathnameRef.current.startsWith('/leader')) {
        void useDashboardStore.getState().fetch();
      }
    };
    const handleVolunteerStatus = (user: UserDto) => {
      useUsersStore.getState().patchOne(user);
      if (useAuthStore.getState().user?.id === user.id) {
        useAuthStore.getState().setUser(user);
      }
    };

    socket.on('notification', handleNotification);
    socket.on('request.created', handleRequestEvent);
    socket.on('request.assigned', handleRequestEvent);
    socket.on('request.unassigned', handleRequestEvent);
    socket.on('request.updated', handleRequestEvent);
    socket.on('volunteer.status', handleVolunteerStatus);

    return () => {
      socket.off('notification', handleNotification);
      socket.off('request.created', handleRequestEvent);
      socket.off('request.assigned', handleRequestEvent);
      socket.off('request.unassigned', handleRequestEvent);
      socket.off('request.updated', handleRequestEvent);
      socket.off('volunteer.status', handleVolunteerStatus);
      disconnect();
    };
  }, [token, connect, disconnect]);
}
