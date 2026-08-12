import { Hall } from '../enums/hall.enum';

export const hallToNumber: Record<Hall, number> = {
  [Hall.HALL_1]: 1,
  [Hall.HALL_2]: 2,
  [Hall.HALL_3]: 3,
  [Hall.HALL_4]: 4,
};

export const numberToHall: Record<number, Hall> = {
  1: Hall.HALL_1,
  2: Hall.HALL_2,
  3: Hall.HALL_3,
  4: Hall.HALL_4,
};
