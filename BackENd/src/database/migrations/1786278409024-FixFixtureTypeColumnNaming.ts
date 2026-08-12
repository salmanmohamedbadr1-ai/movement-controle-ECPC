import { MigrationInterface, QueryRunner } from 'typeorm';

// The original AddFixtureTypeToRequests migration was authored before
// accounting for the project's SnakeNamingStrategy and shipped with the
// literal column/type names "fixtureType"/"requests_fixturetype_enum".
// Any environment where that version already ran has those wrong names on
// disk; environments applying the corrected migration for the first time
// already have the right "fixture_type"/"requests_fixture_type_enum"
// names. The guards make this migration a no-op in the latter case.
export class FixFixtureTypeColumnNaming1786278409024 implements MigrationInterface {
  name = 'FixFixtureTypeColumnNaming1786278409024';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'requests' AND column_name = 'fixtureType'
        ) THEN
          ALTER TABLE "requests" RENAME COLUMN "fixtureType" TO "fixture_type";
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'requests_fixturetype_enum') THEN
          ALTER TYPE "public"."requests_fixturetype_enum" RENAME TO "requests_fixture_type_enum";
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'requests' AND column_name = 'fixture_type'
        ) THEN
          ALTER TABLE "requests" RENAME COLUMN "fixture_type" TO "fixtureType";
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'requests_fixture_type_enum') THEN
          ALTER TYPE "public"."requests_fixture_type_enum" RENAME TO "requests_fixturetype_enum";
        END IF;
      END $$;
    `);
  }
}
