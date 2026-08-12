import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTeamsTable1785591698015 implements MigrationInterface {
  name = 'CreateTeamsTable1785591698015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."teams_hall_enum" AS ENUM('HALL_1', 'HALL_2', 'HALL_3', 'HALL_4')`,
    );
    await queryRunner.query(
      `CREATE TABLE "teams" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "hall" "public"."teams_hall_enum" NOT NULL, "team_number" integer NOT NULL, CONSTRAINT "UQ_15f8e76767adfbd542419f491b8" UNIQUE ("hall", "team_number"), CONSTRAINT "PK_7e5523774a38b08a6236d322403" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "teams"`);
    await queryRunner.query(`DROP TYPE "public"."teams_hall_enum"`);
  }
}
