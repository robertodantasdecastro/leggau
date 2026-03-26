import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProgressMinorCompat2026032600050 implements MigrationInterface {
  name = 'ProgressMinorCompat2026032600050';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "progress_entries"
      DROP CONSTRAINT IF EXISTS "FK_0d2e0a75004cfa994ac919bfccb"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "progress_entries"
      ADD CONSTRAINT "FK_0d2e0a75004cfa994ac919bfccb"
      FOREIGN KEY ("childId") REFERENCES "child_profiles"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }
}
