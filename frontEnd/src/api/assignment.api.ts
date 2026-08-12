import { client } from './client';
import type { AssignmentAttemptDto, RequestDto } from '../types/models';

export async function runAssignment(): Promise<AssignmentAttemptDto[]> {
  return (await client.post<AssignmentAttemptDto[]>('/assignment/run')).data;
}

export async function reassignRequest(id: string): Promise<RequestDto> {
  return (await client.patch<RequestDto>(`/assignment/${id}/reassign`)).data;
}
