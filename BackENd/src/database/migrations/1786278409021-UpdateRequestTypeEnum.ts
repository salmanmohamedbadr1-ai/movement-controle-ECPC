import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateRequestTypeEnum1786278409021
  implements MigrationInterface
{
  name = 'UpdateRequestTypeEnum1786278409021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."requests_request_type_enum_new" AS ENUM('BATHROOM', 'PRAYER', 'BREAK_TIME')`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" ALTER COLUMN "request_type" TYPE "public"."requests_request_type_enum_new" USING (CASE WHEN "request_type"::text IN ('SMOKING', 'OTHER') THEN 'BREAK_TIME' ELSE "request_type"::text END)::"public"."requests_request_type_enum_new"`,
    );
    await queryRunner.query(`DROP TYPE "public"."requests_request_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."requests_request_type_enum_new" RENAME TO "requests_request_type_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."requests_request_type_enum_old" AS ENUM('BATHROOM', 'PRAYER', 'SMOKING', 'OTHER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" ALTER COLUMN "request_type" TYPE "public"."requests_request_type_enum_old" USING (CASE WHEN "request_type"::text = 'BREAK_TIME' THEN 'OTHER' ELSE "request_type"::text END)::"public"."requests_request_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."requests_request_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."requests_request_type_enum_old" RENAME TO "requests_request_type_enum"`,
    );
  }
}
