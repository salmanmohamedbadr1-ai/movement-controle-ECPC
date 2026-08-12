import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFixtureTypeToRequests1786278409023 implements MigrationInterface {
  name = 'AddFixtureTypeToRequests1786278409023';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."requests_fixture_type_enum" AS ENUM('URINAL', 'TOILET')`,
    );

    await queryRunner.query(
      `ALTER TABLE "requests" ADD "fixture_type" "public"."requests_fixture_type_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "requests" DROP COLUMN "fixture_type"`,
    );

    await queryRunner.query(`DROP TYPE "public"."requests_fixture_type_enum"`);
  }
}
