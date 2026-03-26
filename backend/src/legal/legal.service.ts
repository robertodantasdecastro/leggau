import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppUser } from '../common/entities/app-user.entity';
import { AuditEvent } from '../common/entities/audit-event.entity';
import { ConsentRecord } from '../common/entities/consent-record.entity';
import { LegalDocument } from '../common/entities/legal-document.entity';
import { PolicyVersion } from '../common/entities/policy-version.entity';
import { RecordConsentDto } from './dto/record-consent.dto';

@Injectable()
export class LegalService {
  constructor(
    @InjectRepository(AppUser)
    private readonly appUserRepository: Repository<AppUser>,
    @InjectRepository(LegalDocument)
    private readonly legalDocumentRepository: Repository<LegalDocument>,
    @InjectRepository(ConsentRecord)
    private readonly consentRecordRepository: Repository<ConsentRecord>,
    @InjectRepository(PolicyVersion)
    private readonly policyVersionRepository: Repository<PolicyVersion>,
    @InjectRepository(AuditEvent)
    private readonly auditEventRepository: Repository<AuditEvent>,
  ) {}

  async getDocuments() {
    const policies = await this.policyVersionRepository.find({
      where: { status: 'published' },
      order: { publishedAt: 'ASC', createdAt: 'ASC' },
    });

    if (policies.length > 0) {
      return policies.map((policy) => ({
        id: policy.id,
        key: policy.policyKey,
        version: policy.version,
        title: policy.title,
        audience:
          policy.audience === 'parent' ? 'parent_guardian' : policy.audience,
        contentMarkdown: policy.contentMarkdown,
        isActive: policy.status === 'published',
        effectiveAt: policy.publishedAt ?? policy.createdAt,
      }));
    }

    return this.legalDocumentRepository.find({
      where: { isActive: true },
      order: { createdAt: 'ASC' },
    });
  }

  async recordConsent(dto: RecordConsentDto) {
    const [appUser, policyVersion, document] = await Promise.all([
      this.appUserRepository.findOne({
        where: { email: dto.userEmail.toLowerCase() },
      }),
      this.policyVersionRepository.findOne({
        where: {
          policyKey: dto.documentKey,
          status: 'published',
        },
        order: {
          publishedAt: 'DESC',
          createdAt: 'DESC',
        },
      }),
      this.legalDocumentRepository.findOne({
        where: { key: dto.documentKey, isActive: true },
      }),
    ]);

    if (!appUser) {
      throw new NotFoundException('User not found');
    }

    if (!policyVersion && !document) {
      throw new NotFoundException('Legal document not found');
    }

    const consent = await this.consentRecordRepository.save(
      this.consentRecordRepository.create({
        appUserId: appUser.id,
        appUserEmail: appUser.email,
        documentId: document?.id ?? policyVersion?.sourceDocumentId ?? policyVersion?.id,
        documentKey: policyVersion?.policyKey ?? document!.key,
        documentVersion: policyVersion?.version ?? document!.version,
        policyVersionId: policyVersion?.id ?? null,
        status: 'accepted',
        acceptedAt: new Date(),
      }),
    );

    await this.auditEventRepository.save(
      this.auditEventRepository.create({
        eventType: 'consent.accept',
        actorRole: appUser.role,
        actorUserId: appUser.id,
        resourceType: 'policy_version',
        resourceId: policyVersion?.id ?? document?.id ?? null,
        outcome: 'success',
        severity: 'low',
        metadata: {
          documentKey: dto.documentKey,
          documentVersion: policyVersion?.version ?? document?.version ?? 'unknown',
        },
      }),
    );

    return consent;
  }

  async getConsentSummary() {
    const [documents, consents] = await Promise.all([
      this.policyVersionRepository.count({ where: { status: 'published' } }),
      this.consentRecordRepository.count(),
    ]);

    return {
      activeDocuments: documents,
      consentRecords: consents,
    };
  }
}
