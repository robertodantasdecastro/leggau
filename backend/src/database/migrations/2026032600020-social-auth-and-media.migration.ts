import { MigrationInterface, QueryRunner } from 'typeorm';

export class SocialAuthAndMedia2026032600020 implements MigrationInterface {
  name = 'SocialAuthAndMedia2026032600020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "auth_provider_configs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "provider" character varying NOT NULL,
        "displayName" character varying NOT NULL,
        "enabled" boolean NOT NULL DEFAULT false,
        "verificationMode" character varying NOT NULL DEFAULT 'mock',
        "clientId" text,
        "clientSecretEncrypted" text,
        "privateKeyEncrypted" text,
        "issuer" text,
        "jwksUrl" text,
        "allowedAudiences" text,
        "scopes" text,
        "metadata" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_auth_provider_configs_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_auth_provider_configs_provider" UNIQUE ("provider")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "external_identities" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "appUserId" uuid NOT NULL,
        "provider" character varying NOT NULL,
        "providerSubject" character varying NOT NULL,
        "providerConfigId" text,
        "email" text,
        "displayName" text,
        "avatarUrl" text,
        "emailVerifiedAt" timestamp,
        "lastLoginAt" timestamp,
        "profileSnapshot" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_external_identities_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_external_identities_provider_subject"
      ON "external_identities" ("provider", "providerSubject")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "media_verification_jobs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "requestedByUserId" uuid NOT NULL,
        "actorRole" character varying NOT NULL,
        "verificationType" character varying NOT NULL,
        "subjectRole" character varying NOT NULL,
        "subjectProfileId" text,
        "status" character varying NOT NULL DEFAULT 'completed',
        "sampleKey" text,
        "inputAssets" text,
        "extractedData" text,
        "confidenceScore" double precision,
        "matched" boolean,
        "reviewRequired" boolean NOT NULL DEFAULT false,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_media_verification_jobs_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "media_verification_jobs"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_external_identities_provider_subject"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "external_identities"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "auth_provider_configs"`);
  }
}
