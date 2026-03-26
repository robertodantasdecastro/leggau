import { MigrationInterface, QueryRunner } from 'typeorm';

export class InviteOwnership2026032600040 implements MigrationInterface {
  name = 'InviteOwnership2026032600040';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "invites"
      ADD COLUMN IF NOT EXISTS "creatorUserId" text
    `);
    await queryRunner.query(`
      ALTER TABLE "invites"
      ADD COLUMN IF NOT EXISTS "creatorActorRole" text
    `);
    await queryRunner.query(`
      ALTER TABLE "invites"
      ADD COLUMN IF NOT EXISTS "targetActorRole" text
    `);
    await queryRunner.query(`
      ALTER TABLE "invites"
      ADD COLUMN IF NOT EXISTS "acceptedByUserId" text
    `);
    await queryRunner.query(`
      ALTER TABLE "invites"
      ADD COLUMN IF NOT EXISTS "metadata" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "invites"
      DROP COLUMN IF EXISTS "metadata"
    `);
    await queryRunner.query(`
      ALTER TABLE "invites"
      DROP COLUMN IF EXISTS "acceptedByUserId"
    `);
    await queryRunner.query(`
      ALTER TABLE "invites"
      DROP COLUMN IF EXISTS "targetActorRole"
    `);
    await queryRunner.query(`
      ALTER TABLE "invites"
      DROP COLUMN IF EXISTS "creatorActorRole"
    `);
    await queryRunner.query(`
      ALTER TABLE "invites"
      DROP COLUMN IF EXISTS "creatorUserId"
    `);
  }
}
