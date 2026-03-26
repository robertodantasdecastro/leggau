import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeLegacyAudiences2026032600030
  implements MigrationInterface
{
  name = 'NormalizeLegacyAudiences2026032600030';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "legal_documents"
      SET "audience" = 'parent_guardian'
      WHERE "audience" = 'parent'
    `);

    await queryRunner.query(`
      UPDATE "policy_versions"
      SET "audience" = 'parent_guardian'
      WHERE "audience" = 'parent'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "policy_versions"
      SET "audience" = 'parent'
      WHERE "audience" = 'parent_guardian'
        AND "policyKey" IN ('privacy-policy', 'terms-of-use')
    `);

    await queryRunner.query(`
      UPDATE "legal_documents"
      SET "audience" = 'parent'
      WHERE "audience" = 'parent_guardian'
        AND "key" IN ('privacy-policy', 'terms-of-use')
    `);
  }
}
