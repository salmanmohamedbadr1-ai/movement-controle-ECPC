import { formatDistanceToNow } from 'date-fns';
import { Hall } from '../types/enums';
import type { FixtureType, Gender, RequestType } from '../types/enums';

export function timeAgo(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

export function formatHall(hall: Hall): string {
  return hall.replace('HALL_', 'Hall ');
}

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
