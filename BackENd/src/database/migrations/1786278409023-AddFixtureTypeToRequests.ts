import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFixtureTypeToRequests1786278409023
  implements MigrationInterface
{
  name = 'AddFixtureTypeToRequests1786278409023';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."requests_fixturetype_enum" AS ENUM('URINAL', 'TOILET')`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" ADD "fixtureType" "public"."requests_fixturetype_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "requests" DROP COLUMN "fixtureType"`);
    await queryRunner.query(`DROP TYPE "public"."requests_fixturetype_enum"`);
  }
}
