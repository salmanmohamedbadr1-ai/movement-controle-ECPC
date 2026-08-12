import { client } from './client';
import type { NotificationDto } from '../types/models';

export async function listNotifications(unreadOnly?: boolean): Promise<NotificationDto[]> {
  return (
    await client.get<NotificationDto[]>('/notifications', {
      params: unreadOnly ? { unreadOnly: true } : undefined,
    })
  ).data;
}

export async function markNotificationRead(id: string): Promise<NotificationDto> {
  return (await client.patch<NotificationDto>(`/notifications/${id}/read`)).data;
}

export async function markAllNotificationsRead(): Promise<void> {
  await client.patch('/notifications/read-all');
}
