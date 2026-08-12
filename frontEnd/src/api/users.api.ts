import { client } from './client';
import type { UserDto } from '../types/models';
import type { Gender, UserRole, VolunteerStatus } from '../types/enums';

export interface CreateUserPayload {
  name: string;
  role: UserRole;
  hall: number;
  gender: Gender;
}

export interface BulkCreateUsersPayload {
  role: UserRole;
  hall: number;
  users: { name: string; gender: Gender }[];
}

export async function listUsers(): Promise<UserDto[]> {
  return (await client.get<UserDto[]>('/users')).data;
}

export async function createUser(payload: CreateUserPayload): Promise<UserDto> {
  return (await client.post<UserDto>('/users', payload)).data;
}

export async function bulkCreateUsers(payload: BulkCreateUsersPayload): Promise<UserDto[]> {
  return (await client.post<UserDto[]>('/users/bulk', payload)).data;
}

export async function exportHallPdf(hall: number): Promise<Blob> {
  return (
    await client.get<Blob>(`/users/export/pdf`, {
      params: { hall },
      responseType: 'blob',
    })
  ).data;
}

export async function updateUserStatus(id: string, status: VolunteerStatus): Promise<UserDto> {
  return (await client.patch<UserDto>(`/users/${id}/status`, { status })).data;
}

export async function updateUserCapacity(id: string, capacity: number): Promise<UserDto> {
  return (await client.patch<UserDto>(`/users/${id}/capacity`, { capacity })).data;
}

export async function deleteUser(id: string): Promise<void> {
  await client.delete(`/users/${id}`);
}
