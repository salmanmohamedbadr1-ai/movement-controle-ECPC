import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveTeamsUseHallAndTeamNumberOnRequests1785608729818 implements MigrationInterface {
  name = 'RemoveTeamsUseHallAndTeamNumberOnRequests1785608729818';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."requests_hall_enum" AS ENUM('HALL_1', 'HALL_2', 'HALL_3', 'HALL_4')`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" ADD "hall" "public"."requests_hall_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "requests" ADD "team_number" integer`);

    // Backfill from the still-present teams table before it's dropped below.
    await queryRunner.query(
      `UPDATE "requests" r SET "hall" = t."hall"::text::"public"."requests_hall_enum", "team_number" = t."team_number" FROM "teams" t WHERE t."id" = r."team_id"`,
    );

    await queryRunner.query(
      `ALTER TABLE "requests" ALTER COLUMN "hall" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" ALTER COLUMN "team_number" SET NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "requests" DROP CONSTRAINT "FK_11e5e4b7a34aac7c9349a24ad85"`,
    );
    await queryRunner.query(`ALTER TABLE "requests" DROP COLUMN "team_id"`);

    await queryRunner.query(`DROP TABLE "teams"`);
    await queryRunner.query(`DROP TYPE "public"."teams_hall_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Best-effort only: recreates the teams table/enum and an empty team_id
    // column, but does NOT attempt to reconstruct historical team rows or
    // re-link team_id — once the normalization is gone there's no way to
    // recover which distinct (hall, teamNumber) pairs used to be their own
    // team row. Not a realistic revert path for a dev-stage project.
    await queryRunner.query(
      `CREATE TYPE "public"."teams_hall_enum" AS ENUM('HALL_1', 'HALL_2', 'HALL_3', 'HALL_4')`,
    );
    await queryRunner.query(
      `CREATE TABLE "teams" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "hall" "public"."teams_hall_enum" NOT NULL, "team_number" integer NOT NULL, CONSTRAINT "UQ_15f8e76767adfbd542419f491b8" UNIQUE ("hall", "team_number"), CONSTRAINT "PK_7e5523774a38b08a6236d322403" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(`ALTER TABLE "requests" ADD "team_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "requests" ADD CONSTRAINT "FK_11e5e4b7a34aac7c9349a24ad85" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(`ALTER TABLE "requests" DROP COLUMN "team_number"`);
    await queryRunner.query(`ALTER TABLE "requests" DROP COLUMN "hall"`);
    await queryRunner.query(`DROP TYPE "public"."requests_hall_enum"`);
  }
}
