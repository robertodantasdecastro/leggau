import { MigrationInterface, QueryRunner } from 'typeorm';

export class PhaseBCore2026032600010 implements MigrationInterface {
  name = 'PhaseBCore2026032600010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      ALTER TABLE "app_users"
      ALTER COLUMN "role" SET DEFAULT 'parent_guardian'
    `);
    await queryRunner.query(`
      UPDATE "app_users"
      SET "role" = 'parent_guardian'
      WHERE "role" = 'parent'
    `);

    await queryRunner.query(`
      ALTER TABLE "parent_profiles"
      ADD COLUMN IF NOT EXISTS "appUserId" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "parent_profiles"
      ALTER COLUMN "role" SET DEFAULT 'parent_guardian'
    `);
    await queryRunner.query(`
      UPDATE "parent_profiles"
      SET "role" = 'parent_guardian'
      WHERE "role" = 'guardian'
    `);
    await queryRunner.query(`
      UPDATE "parent_profiles" p
      SET "appUserId" = u.id
      FROM "app_users" u
      WHERE u.email = p.email
        AND (p."appUserId" IS NULL OR p."appUserId" <> u.id)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_parent_profiles_app_user_id"
      ON "parent_profiles" ("appUserId")
      WHERE "appUserId" IS NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "child_profiles"
      ADD COLUMN IF NOT EXISTS "ageBand" character varying DEFAULT '6-9'
    `);
    await queryRunner.query(`
      UPDATE "child_profiles"
      SET "ageBand" = CASE
        WHEN age >= 13 THEN '13-17'
        WHEN age >= 10 THEN '10-12'
        ELSE '6-9'
      END
    `);

    await queryRunner.query(`
      ALTER TABLE "consent_records"
      ADD COLUMN IF NOT EXISTS "policyVersionId" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "consent_records"
      ADD COLUMN IF NOT EXISTS "status" character varying DEFAULT 'accepted'
    `);
    await queryRunner.query(`
      ALTER TABLE "consent_records"
      ADD COLUMN IF NOT EXISTS "revokedAt" timestamp
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "adolescent_profiles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        "age" integer NOT NULL,
        "ageBand" character varying NOT NULL DEFAULT '13-17',
        "avatar" character varying NOT NULL DEFAULT 'gau-rounded-pixel',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_adolescent_profiles_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "therapist_profiles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "appUserId" uuid NOT NULL,
        "name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "role" character varying NOT NULL DEFAULT 'therapist',
        "adminApprovalStatus" character varying NOT NULL DEFAULT 'pending',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_therapist_profiles_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_therapist_profiles_app_user_id" UNIQUE ("appUserId"),
        CONSTRAINT "UQ_therapist_profiles_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "guardian_links" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "parentUserId" uuid NOT NULL,
        "parentProfileId" uuid NOT NULL,
        "minorProfileId" uuid NOT NULL,
        "minorRole" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'active',
        "approvedAt" timestamp,
        "revokedAt" timestamp,
        "createdBy" text,
        "auditContext" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_guardian_links_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_guardian_links_unique_active"
      ON "guardian_links" ("parentProfileId", "minorProfileId", "minorRole")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "care_team_memberships" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "therapistUserId" uuid NOT NULL,
        "therapistProfileId" uuid,
        "parentUserId" uuid NOT NULL,
        "parentProfileId" uuid NOT NULL,
        "minorProfileId" uuid NOT NULL,
        "minorRole" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
        "adminApprovalStatus" character varying NOT NULL DEFAULT 'pending',
        "parentApprovalStatus" character varying NOT NULL DEFAULT 'pending',
        "scope" text,
        "approvedAt" timestamp,
        "revokedAt" timestamp,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_care_team_memberships_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "device_sessions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "accessToken" character varying NOT NULL,
        "refreshToken" character varying NOT NULL,
        "scope" character varying NOT NULL,
        "subjectId" uuid NOT NULL,
        "email" character varying NOT NULL,
        "actorRole" character varying NOT NULL,
        "deviceId" text,
        "deviceType" text,
        "sessionStatus" character varying NOT NULL DEFAULT 'active',
        "expiresAt" timestamp NOT NULL,
        "refreshExpiresAt" timestamp NOT NULL,
        "lastSeenAt" timestamp,
        "revokedAt" timestamp,
        "metadata" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_device_sessions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_device_sessions_access_token" UNIQUE ("accessToken"),
        CONSTRAINT "UQ_device_sessions_refresh_token" UNIQUE ("refreshToken")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "token" character varying NOT NULL,
        "userId" uuid NOT NULL,
        "email" character varying NOT NULL,
        "expiresAt" timestamp NOT NULL,
        "consumedAt" timestamp,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_password_reset_tokens_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_password_reset_tokens_token" UNIQUE ("token")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "eventType" character varying NOT NULL,
        "actorRole" character varying NOT NULL,
        "actorUserId" text,
        "resourceType" character varying NOT NULL,
        "resourceId" text,
        "outcome" character varying NOT NULL,
        "severity" character varying NOT NULL DEFAULT 'low',
        "metadata" text,
        "occurredAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_events_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "moderation_cases" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "sourceType" character varying NOT NULL,
        "sourceId" text,
        "status" character varying NOT NULL DEFAULT 'open',
        "severity" character varying NOT NULL DEFAULT 'medium',
        "policyCode" text,
        "aiDecision" text,
        "humanReviewRequired" boolean NOT NULL DEFAULT true,
        "reviewedBy" text,
        "reviewedAt" timestamp,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_moderation_cases_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "incidents" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "sourceType" character varying NOT NULL,
        "sourceId" text,
        "severity" character varying NOT NULL DEFAULT 'medium',
        "status" character varying NOT NULL DEFAULT 'open',
        "summary" text NOT NULL,
        "createdByUserId" text,
        "createdByRole" text,
        "reviewedBy" text,
        "reviewedAt" timestamp,
        "metadata" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_incidents_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "interaction_policies" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "minorProfileId" uuid NOT NULL,
        "minorRole" character varying NOT NULL,
        "ageBand" character varying NOT NULL,
        "roomsEnabled" boolean NOT NULL DEFAULT true,
        "presenceEnabled" boolean NOT NULL DEFAULT true,
        "messagingMode" character varying NOT NULL DEFAULT 'none',
        "therapistParticipationAllowed" boolean NOT NULL DEFAULT false,
        "guardianOverride" text,
        "effectiveFrom" timestamp,
        "effectiveTo" timestamp,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_interaction_policies_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_interaction_policies_minor"
      ON "interaction_policies" ("minorProfileId", "minorRole")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "policy_versions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "policyKey" character varying NOT NULL,
        "version" character varying NOT NULL,
        "title" character varying NOT NULL,
        "audience" character varying NOT NULL,
        "contentMarkdown" text NOT NULL,
        "status" character varying NOT NULL DEFAULT 'published',
        "sourceDocumentId" text,
        "supersededBy" text,
        "publishedAt" timestamp,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_policy_versions_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_policy_versions_key_version"
      ON "policy_versions" ("policyKey", "version")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invites" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "inviteType" character varying NOT NULL,
        "targetEmail" character varying NOT NULL,
        "minorProfileId" text,
        "status" character varying NOT NULL DEFAULT 'pending',
        "acceptedAt" timestamp,
        "expiresAt" timestamp,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_invites_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "parent_approvals" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "parentUserId" uuid NOT NULL,
        "approvalType" character varying NOT NULL,
        "targetId" character varying NOT NULL,
        "decision" character varying NOT NULL DEFAULT 'granted',
        "status" character varying NOT NULL DEFAULT 'active',
        "metadata" text,
        "decidedAt" timestamp,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_parent_approvals_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "adolescent_profiles" ("name", "age", "ageBand", "avatar")
      SELECT c."name", c."age", '13-17', c."avatar"
      FROM "child_profiles" c
      WHERE c.age >= 13
        AND NOT EXISTS (
          SELECT 1
          FROM "adolescent_profiles" a
          WHERE a."name" = c."name" AND a."age" = c."age"
        )
    `);

    await queryRunner.query(`
      INSERT INTO "guardian_links" (
        "parentUserId",
        "parentProfileId",
        "minorProfileId",
        "minorRole",
        "status",
        "approvedAt",
        "createdBy",
        "auditContext"
      )
      SELECT
        COALESCE(p."appUserId", u.id),
        p.id,
        c.id,
        'child',
        'active',
        now(),
        'phase-b-migration',
        '{"source":"child_profiles.parentId"}'
      FROM "child_profiles" c
      INNER JOIN "parent_profiles" p ON p.id = c."parentId"
      LEFT JOIN "app_users" u ON u.email = p.email
      WHERE c.age < 13
        AND NOT EXISTS (
          SELECT 1
          FROM "guardian_links" g
          WHERE g."parentProfileId" = p.id
            AND g."minorProfileId" = c.id
            AND g."minorRole" = 'child'
        )
    `);

    await queryRunner.query(`
      INSERT INTO "guardian_links" (
        "parentUserId",
        "parentProfileId",
        "minorProfileId",
        "minorRole",
        "status",
        "approvedAt",
        "createdBy",
        "auditContext"
      )
      SELECT
        COALESCE(p."appUserId", u.id),
        p.id,
        a.id,
        'adolescent',
        'active',
        now(),
        'phase-b-migration',
        json_build_object('source', 'child_profiles.age>=13', 'legacyParentId', c."parentId")::text
      FROM "child_profiles" c
      INNER JOIN "parent_profiles" p ON p.id = c."parentId"
      LEFT JOIN "app_users" u ON u.email = p.email
      INNER JOIN "adolescent_profiles" a ON a."name" = c."name" AND a."age" = c."age"
      WHERE c.age >= 13
        AND NOT EXISTS (
          SELECT 1
          FROM "guardian_links" g
          WHERE g."parentProfileId" = p.id
            AND g."minorProfileId" = a.id
            AND g."minorRole" = 'adolescent'
        )
    `);

    await queryRunner.query(`
      INSERT INTO "interaction_policies" (
        "minorProfileId",
        "minorRole",
        "ageBand",
        "roomsEnabled",
        "presenceEnabled",
        "messagingMode",
        "therapistParticipationAllowed",
        "effectiveFrom"
      )
      SELECT c.id, 'child', c."ageBand", true, true, 'none', false, now()
      FROM "child_profiles" c
      WHERE c.age < 13
        AND NOT EXISTS (
          SELECT 1
          FROM "interaction_policies" ip
          WHERE ip."minorProfileId" = c.id
            AND ip."minorRole" = 'child'
        )
    `);

    await queryRunner.query(`
      INSERT INTO "interaction_policies" (
        "minorProfileId",
        "minorRole",
        "ageBand",
        "roomsEnabled",
        "presenceEnabled",
        "messagingMode",
        "therapistParticipationAllowed",
        "effectiveFrom"
      )
      SELECT a.id, 'adolescent', a."ageBand", true, true, 'none', false, now()
      FROM "adolescent_profiles" a
      WHERE NOT EXISTS (
        SELECT 1
        FROM "interaction_policies" ip
        WHERE ip."minorProfileId" = a.id
          AND ip."minorRole" = 'adolescent'
      )
    `);

    await queryRunner.query(`
      INSERT INTO "policy_versions" (
        "policyKey",
        "version",
        "title",
        "audience",
        "contentMarkdown",
        "status",
        "sourceDocumentId",
        "publishedAt"
      )
      SELECT
        ld."key",
        ld."version",
        ld."title",
        ld."audience",
        ld."contentMarkdown",
        CASE WHEN ld."isActive" THEN 'published' ELSE 'draft' END,
        ld.id,
        COALESCE(ld."effectiveAt", ld."createdAt")
      FROM "legal_documents" ld
      WHERE NOT EXISTS (
        SELECT 1
        FROM "policy_versions" pv
        WHERE pv."policyKey" = ld."key"
          AND pv."version" = ld."version"
      )
    `);

    await queryRunner.query(`
      UPDATE "consent_records" cr
      SET "policyVersionId" = pv.id,
          "status" = 'accepted'
      FROM "policy_versions" pv
      WHERE pv."policyKey" = cr."documentKey"
        AND pv."version" = cr."documentVersion"
        AND cr."policyVersionId" IS NULL
    `);

    await queryRunner.query(`
      DELETE FROM "child_profiles"
      WHERE age >= 13
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "parent_approvals"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invites"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_policy_versions_key_version"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "policy_versions"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_interaction_policies_minor"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "interaction_policies"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "incidents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "moderation_cases"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_events"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "password_reset_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "device_sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "care_team_memberships"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_guardian_links_unique_active"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "guardian_links"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "therapist_profiles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "adolescent_profiles"`);
  }
}
