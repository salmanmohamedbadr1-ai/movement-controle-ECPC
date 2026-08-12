import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGenderToRequests1785610222571 implements MigrationInterface {
  name = 'AddGenderToRequests1785610222571';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."requests_gender_enum" AS ENUM('MALE', 'FEMALE')`,
    );
    // DEFAULT here is a one-time backfill convenience for existing rows,
    // not a real product default — dropped immediately after so every
    // future insert must specify gender explicitly (DTO enforces this).
    await queryRunner.query(
      `ALTER TABLE "requests" ADD "gender" "public"."requests_gender_enum" NOT NULL DEFAULT 'MALE'`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" ALTER COLUMN "gender" DROP DEFAULT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "requests" DROP COLUMN "gender"`);
    await queryRunner.query(`DROP TYPE "public"."requests_gender_enum"`);
  }
}
