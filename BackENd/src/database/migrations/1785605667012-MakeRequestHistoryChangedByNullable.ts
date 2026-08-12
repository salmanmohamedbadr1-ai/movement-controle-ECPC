import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeRequestHistoryChangedByNullable1785605667012 implements MigrationInterface {
  name = 'MakeRequestHistoryChangedByNullable1785605667012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "request_history" DROP CONSTRAINT "FK_4abff0fc1d3c0eb9050f77b106f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "request_history" ALTER COLUMN "changed_by" DROP NOT NULL`,
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
      `ALTER TABLE "request_history" ALTER COLUMN "changed_by" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "request_history" ADD CONSTRAINT "FK_4abff0fc1d3c0eb9050f77b106f" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
