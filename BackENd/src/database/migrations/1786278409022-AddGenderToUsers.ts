import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGenderToUsers1786278409022 implements MigrationInterface {
  name = 'AddGenderToUsers1786278409022';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_gender_enum" AS ENUM('MALE', 'FEMALE')`,
    );
    // DEFAULT here is a one-time backfill convenience for existing rows,
    // not a real product default — dropped immediately after so every
    // future insert must specify gender explicitly (DTO enforces this).
    await queryRunner.query(
      `ALTER TABLE "users" ADD "gender" "public"."users_gender_enum" NOT NULL DEFAULT 'MALE'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "gender" DROP DEFAULT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "gender"`);
    await queryRunner.query(`DROP TYPE "public"."users_gender_enum"`);
  }
}
