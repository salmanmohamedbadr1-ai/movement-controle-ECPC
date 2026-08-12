const HALL_GROUPS: number[][] = [
  [1, 2],
  [3],
  [4],
];

export function getHallGroup(hallNumber: number): number[] {
  return HALL_GROUPS.find((group) => group.includes(hallNumber)) ?? [hallNumber];
}

export function isSameHallGroup(a: number, b: number): boolean {
  return getHallGroup(a).includes(b);
}

export function formatHallGroupLabel(hallNumber: number): string {
  return `Hall ${getHallGroup(hallNumber).join(' & ')}`;
}
