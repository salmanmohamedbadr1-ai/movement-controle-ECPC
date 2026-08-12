import { client } from './client';
import type { LoginResponseDto } from '../types/models';

export async function login(code: string): Promise<LoginResponseDto> {
  const res = await client.post<LoginResponseDto>('/auth/login', { code });
  return res.data;
}
