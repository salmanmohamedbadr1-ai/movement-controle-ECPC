import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSoftDeleteToUsers1785611783877 implements MigrationInterface {
  name = 'AddSoftDeleteToUsers1785611783877';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted_at"`);
  }
}
