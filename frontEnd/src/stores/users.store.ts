import { create } from 'zustand';
import * as usersApi from '../api/users.api';
import type { BulkCreateUsersPayload, CreateUserPayload } from '../api/users.api';
import type { UserDto } from '../types/models';
import type { VolunteerStatus } from '../types/enums';

interface UsersState {
  users: UserDto[];
  loading: boolean;
  error: string | null;
  lastCreatedBatch: UserDto[] | null;
  fetch: () => Promise<void>;
  create: (payload: CreateUserPayload) => Promise<UserDto>;
  createBulk: (payload: BulkCreateUsersPayload) => Promise<UserDto[]>;
  updateStatus: (id: string, status: VolunteerStatus) => Promise<void>;
  updateCapacity: (id: string, capacity: number) => Promise<void>;
  updateHall: (id: string, hall: number) => Promise<void>;
  remove: (id: string) => Promise<void>;
  patchOne: (user: UserDto) => void;
  clearLastCreatedBatch: () => void;
}

export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],
  loading: false,
  error: null,
  lastCreatedBatch: null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const users = await usersApi.listUsers();
      set({ users, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load users',
      });
    }
  },

  create: async (payload) => {
    const created = await usersApi.createUser(payload);
    set({ users: [...get().users, created], lastCreatedBatch: [created] });
    return created;
  },

  createBulk: async (payload) => {
    const created = await usersApi.bulkCreateUsers(payload);
    set({ users: [...get().users, ...created], lastCreatedBatch: created });
    return created;
  },

  updateStatus: async (id, status) => {
    const updated = await usersApi.updateUserStatus(id, status);
    get().patchOne(updated);
  },

  updateCapacity: async (id, capacity) => {
    const updated = await usersApi.updateUserCapacity(id, capacity);
    get().patchOne(updated);
  },

  updateHall: async (id, hall) => {
    const updated = await usersApi.updateUserHall(id, hall);
    get().patchOne(updated);
  },

  remove: async (id) => {
    await usersApi.deleteUser(id);
    set({ users: get().users.filter((u) => u.id !== id) });
  },

  patchOne: (user) => {
    set({
      users: get().users.map((u) => (u.id === user.id ? user : u)),
    });
  },

  clearLastCreatedBatch: () => set({ lastCreatedBatch: null }),
}));
