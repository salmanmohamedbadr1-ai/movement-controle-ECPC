import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRequestsTable1785595977751 implements MigrationInterface {
  name = 'CreateRequestsTable1785595977751';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."requests_request_type_enum" AS ENUM('BATHROOM', 'PRAYER', 'SMOKING', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."requests_status_enum" AS ENUM('WAITING', 'ASSIGNED', 'PICKED_UP', 'COMPLETED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "team_id" uuid NOT NULL, "volunteer_id" uuid, "request_type" "public"."requests_request_type_enum" NOT NULL, "status" "public"."requests_status_enum" NOT NULL DEFAULT 'WAITING', "priority" integer NOT NULL DEFAULT '0', "assigned_at" TIMESTAMP WITH TIME ZONE, "picked_up_at" TIMESTAMP WITH TIME ZONE, "completed_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_0428f484e96f9e6a55955f29b5f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."request_history_status_enum" AS ENUM('WAITING', 'ASSIGNED', 'PICKED_UP', 'COMPLETED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "request_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "request_id" uuid NOT NULL, "changed_by" uuid NOT NULL, "status" "public"."request_history_status_enum" NOT NULL, CONSTRAINT "PK_225faa48c0dca41172e29f4cb9c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" ADD CONSTRAINT "FK_11e5e4b7a34aac7c9349a24ad85" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" ADD CONSTRAINT "FK_7caaf9742f97bf0054eac6af8a9" FOREIGN KEY ("volunteer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "request_history" ADD CONSTRAINT "FK_6ebdc8efebc3beaf49aa75ba6ac" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "request_history" ADD CONSTRAINT "FK_4abff0fc1d3c0eb9050f77b106f" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "request_history" DROP CONSTRAINT "FK_4abff0fc1d3c0eb9050f77b106f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "request_history" DROP CONSTRAINT "FK_6ebdc8efebc3beaf49aa75ba6ac"`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" DROP CONSTRAINT "FK_7caaf9742f97bf0054eac6af8a9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" DROP CONSTRAINT "FK_11e5e4b7a34aac7c9349a24ad85"`,
    );
    await queryRunner.query(`DROP TABLE "request_history"`);
    await queryRunner.query(`DROP TYPE "public"."request_history_status_enum"`);
    await queryRunner.query(`DROP TABLE "requests"`);
    await queryRunner.query(`DROP TYPE "public"."requests_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."requests_request_type_enum"`);
  }
}
