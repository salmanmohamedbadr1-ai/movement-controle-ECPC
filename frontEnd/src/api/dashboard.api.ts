import { client } from './client';
import type { DashboardOverviewDto } from '../types/models';

export async function getDashboardOverview(): Promise<DashboardOverviewDto> {
  return (await client.get<DashboardOverviewDto>('/dashboard/overview')).data;
}
