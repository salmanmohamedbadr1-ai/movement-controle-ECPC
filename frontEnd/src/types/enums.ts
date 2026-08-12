// Mirrors the backend's enums exactly (src/common/enums/*.enum.ts). Plain TS
// can't use the `enum` keyword here (tsconfig has `erasableSyntaxOnly`), so
// these are const-object + union-type pairs instead — same usage, same values.

export const UserRole = {
  LEADER: 'LEADER',
  VOLUNTEER: 'VOLUNTEER',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const VolunteerStatus = {
  AVAILABLE: 'AVAILABLE',
  BUSY: 'BUSY',
  OFFLINE: 'OFFLINE',
} as const;
export type VolunteerStatus = (typeof VolunteerStatus)[keyof typeof VolunteerStatus];

export const RequestType = {
  BATHROOM: 'BATHROOM',
  PRAYER: 'PRAYER',
  BREAK_TIME: 'BREAK_TIME',
} as const;
export type RequestType = (typeof RequestType)[keyof typeof RequestType];

export const RequestStatus = {
  WAITING: 'WAITING',
  ASSIGNED: 'ASSIGNED',
  PICKED_UP: 'PICKED_UP',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];

export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const Hall = {
  HALL_1: 'HALL_1',
  HALL_2: 'HALL_2',
  HALL_3: 'HALL_3',
  HALL_4: 'HALL_4',
} as const;
export type Hall = (typeof Hall)[keyof typeof Hall];

export const NotificationType = {
  REQUEST_CREATED: 'REQUEST_CREATED',
  REQUEST_ASSIGNED: 'REQUEST_ASSIGNED',
  REQUEST_UNASSIGNED: 'REQUEST_UNASSIGNED',
  REQUEST_COMPLETED: 'REQUEST_COMPLETED',
  REQUEST_CANCELLED: 'REQUEST_CANCELLED',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
