import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAvailableSinceToUsers1785597180205 implements MigrationInterface {
  name = 'AddAvailableSinceToUsers1785597180205';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "available_since" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "available_since"`,
    );
  }
}
