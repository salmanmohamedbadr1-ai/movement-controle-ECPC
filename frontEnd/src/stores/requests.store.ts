import { create } from 'zustand';
import * as requestsApi from '../api/requests.api';
import type { CreateRequestPayload } from '../api/requests.api';
import type { RequestDto } from '../types/models';

export type RequestBucket = 'waiting' | 'active' | 'completed' | 'all' | 'myActive';

interface RequestsState {
  waiting: RequestDto[];
  active: RequestDto[];
  completed: RequestDto[];
  all: RequestDto[];
  myActive: RequestDto[];
  loading: boolean;
  error: string | null;
  activeView: RequestBucket | null;
  setActiveView: (view: RequestBucket | null) => void;
  fetchWaiting: () => Promise<void>;
  fetchActive: () => Promise<void>;
  fetchCompleted: () => Promise<void>;
  fetchAll: () => Promise<void>;
  fetchMyActive: () => Promise<void>;
  refreshCurrent: () => void;
  create: (payload: CreateRequestPayload) => Promise<RequestDto>;
  start: (id: string) => Promise<void>;
  pickup: (id: string) => Promise<void>;
  complete: (id: string) => Promise<void>;
  cancel: (id: string) => Promise<void>;
}

async function guarded(
  set: (partial: Partial<RequestsState>) => void,
  run: () => Promise<void>,
): Promise<void> {
  set({ loading: true, error: null });
  try {
    await run();
    set({ loading: false });
  } catch (err) {
    set({
      loading: false,
      error: err instanceof Error ? err.message : 'Request failed',
    });
    throw err;
  }
}

export const useRequestsStore = create<RequestsState>((set, get) => ({
  waiting: [],
  active: [],
  completed: [],
  all: [],
  myActive: [],
  loading: false,
  error: null,
  activeView: null,
  setActiveView: (view) => set({ activeView: view }),

  fetchWaiting: () =>
    guarded(set, async () => set({ waiting: await requestsApi.listWaiting() })),
  fetchActive: () =>
    guarded(set, async () => set({ active: await requestsApi.listActive() })),
  fetchCompleted: () =>
    guarded(set, async () => set({ completed: await requestsApi.listCompleted() })),
  fetchAll: () => guarded(set, async () => set({ all: await requestsApi.listAll() })),
  fetchMyActive: () =>
    guarded(set, async () => set({ myActive: await requestsApi.listMyActive() })),

  refreshCurrent: () => {
    const view = get().activeView;
    if (view === 'waiting') void get().fetchWaiting();
    else if (view === 'active') void get().fetchActive();
    else if (view === 'completed') void get().fetchCompleted();
    else if (view === 'all') void get().fetchAll();
    else if (view === 'myActive') void get().fetchMyActive();
  },

  create: async (payload) => {
    const created = await requestsApi.createRequest(payload);
    get().refreshCurrent();
    return created;
  },
  start: async (id) => {
    await requestsApi.startRequest(id);
    get().refreshCurrent();
  },
  pickup: async (id) => {
    await requestsApi.pickupRequest(id);
    get().refreshCurrent();
  },
  complete: async (id) => {
    await requestsApi.completeRequest(id);
    get().refreshCurrent();
  },
  cancel: async (id) => {
    await requestsApi.cancelRequest(id);
    get().refreshCurrent();
  },
}));
