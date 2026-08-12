import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHallToUsers1786278409020 implements MigrationInterface {
  name = 'AddHallToUsers1786278409020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "hall" smallint`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "CHK_users_hall_range" CHECK ("hall" IS NULL OR ("hall" >= 1 AND "hall" <= 4))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "CHK_users_hall_range"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "hall"`);
  }
}
