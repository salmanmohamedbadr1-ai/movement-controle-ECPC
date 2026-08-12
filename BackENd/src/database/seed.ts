import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { Gender } from '../common/enums/gender.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { UsersService } from '../modules/users/users.service';

const VOLUNTEER_NAMES = [
  'Alice Volunteer',
  'Bilal Volunteer',
  'Carla Volunteer',
  'Dara Volunteer',
  'Emeka Volunteer',
  'Farah Volunteer',
  'Gina Volunteer',
  'Hassan Volunteer',
];
const VOLUNTEER_CAPACITIES = [1, 1, 2, 2, 2, 3, 3, 1];

async function seed(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const dataSource = app.get(DataSource);
    await dataSource.query(
      'TRUNCATE TABLE notifications, request_history, requests, users RESTART IDENTITY CASCADE',
    );

    const usersService = app.get(UsersService);

    const codes: { role: string; name: string; code: string }[] = [];

    const leader = await usersService.create({
      name: 'Competition Leader',
      role: UserRole.LEADER,
      hall: 1,
      gender: Gender.MALE,
    });
    codes.push({ role: 'LEADER', name: leader.name, code: leader.code });

    for (let i = 0; i < VOLUNTEER_NAMES.length; i++) {
      const volunteer = await usersService.create({
        name: VOLUNTEER_NAMES[i],
        role: UserRole.VOLUNTEER,
        hall: (i % 4) + 1,
        gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
      });
      await usersService.updateCapacity(volunteer.id, {
        capacity: VOLUNTEER_CAPACITIES[i],
      });
      codes.push({
        role: 'VOLUNTEER',
        name: volunteer.name,
        code: volunteer.code,
      });
    }

    console.log(
      '\nSeed complete. Login codes (the only credential — save these):\n',
    );
    console.table(codes);
  } finally {
    await app.close();
  }
}

void seed();
