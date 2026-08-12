import { client } from './client';
import type { RequestDto } from '../types/models';
import type { FixtureType, Gender, Hall, RequestType } from '../types/enums';

export interface CreateRequestPayload {
  hall: Hall;
  teamNumber: number;
  gender: Gender;
  requestType: RequestType;
  fixtureType?: FixtureType;
  priority?: number;
}

export async function createRequest(payload: CreateRequestPayload): Promise<RequestDto> {
  const res = await client.post<RequestDto>('/requests', payload);
  return res.data;
}

export async function listWaiting(): Promise<RequestDto[]> {
  return (await client.get<RequestDto[]>('/requests/waiting')).data;
}

export async function listActive(): Promise<RequestDto[]> {
  return (await client.get<RequestDto[]>('/requests/active')).data;
}

export async function listCompleted(): Promise<RequestDto[]> {
  return (await client.get<RequestDto[]>('/requests/completed')).data;
}

export async function listAll(): Promise<RequestDto[]> {
  return (await client.get<RequestDto[]>('/requests')).data;
}

export async function listMyActive(): Promise<RequestDto[]> {
  return (await client.get<RequestDto[]>('/requests/my-active')).data;
}

export async function getRequest(id: string): Promise<RequestDto> {
  return (await client.get<RequestDto>(`/requests/${id}`)).data;
}

export async function startRequest(id: string): Promise<RequestDto> {
  return (await client.patch<RequestDto>(`/requests/${id}/start`)).data;
}

export async function pickupRequest(id: string): Promise<RequestDto> {
  return (await client.patch<RequestDto>(`/requests/${id}/pickup`)).data;
}

export async function completeRequest(id: string): Promise<RequestDto> {
  return (await client.patch<RequestDto>(`/requests/${id}/complete`)).data;
}

export async function cancelRequest(id: string): Promise<RequestDto> {
  return (await client.patch<RequestDto>(`/requests/${id}/cancel`)).data;
}
