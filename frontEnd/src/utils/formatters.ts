import { formatDistanceToNow } from 'date-fns';
import { Hall } from '../types/enums';
import type { FixtureType, Gender, RequestType } from '../types/enums';

export function timeAgo(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

const HALL_GROUPS: Hall[][] = [[Hall.HALL_1, Hall.HALL_2], [Hall.HALL_3], [Hall.HALL_4]];

export function getHallGroup(hall: Hall): Hall[] {
  return HALL_GROUPS.find((g) => g.includes(hall)) ?? [hall];
}

export function formatHall(hall: Hall): string {
  return `Hall ${getHallGroup(hall)
    .map((h) => h.replace('HALL_', ''))
    .join(' & ')}`;
}

export const HALL_GROUP_OPTIONS: { value: Hall; label: string }[] = HALL_GROUPS.map((group) => ({
  value: group[0],
  label: formatHall(group[0]),
}));

const HALL_NUMBER_GROUPS: number[][] = [[1, 2], [3], [4]];

export function getHallNumberGroup(n: number): number[] {
  return HALL_NUMBER_GROUPS.find((g) => g.includes(n)) ?? [n];
}

export function formatHallNumber(n: number): string {
  return `Hall ${getHallNumberGroup(n).join(' & ')}`;
}

export const HALL_NUMBER_GROUP_OPTIONS: { value: number; label: string }[] =
  HALL_NUMBER_GROUPS.map((group) => ({
    value: group[0],
    label: formatHallNumber(group[0]),
  }));

export function formatRequestType(type: RequestType): string {
  return type
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

export function formatGender(gender: Gender): string {
  return gender.charAt(0) + gender.slice(1).toLowerCase();
}

export function formatFixtureType(fixtureType: FixtureType): string {
  return fixtureType.charAt(0) + fixtureType.slice(1).toLowerCase();
}

export function formatTeam(hall: Hall, teamNumber: number): string {
  return `${formatHall(hall)} · Team ${teamNumber}`;
}

const TEAM_NUMBER_TO_HALL: Record<string, Hall> = {
  '1': Hall.HALL_1,
  '2': Hall.HALL_2,
  '3': Hall.HALL_3,
  '4': Hall.HALL_4,
};

export function getHallFromTeamNumber(teamNumber: number): Hall | null {
  const firstDigit = String(teamNumber)[0];
  return TEAM_NUMBER_TO_HALL[firstDigit] ?? null;
}
