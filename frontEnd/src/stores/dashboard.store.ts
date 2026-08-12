import { create } from 'zustand';
import * as dashboardApi from '../api/dashboard.api';
import type { DashboardOverviewDto } from '../types/models';

interface DashboardState {
  overview: DashboardOverviewDto | null;
  loading: boolean;
  fetch: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  overview: null,
  loading: false,
  fetch: async () => {
    set({ loading: true });
    try {
      const overview = await dashboardApi.getDashboardOverview();
      set({ overview, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));
