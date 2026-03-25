import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppUser } from '../common/entities/app-user.entity';
import { ConsentRecord } from '../common/entities/consent-record.entity';
import { LegalDocument } from '../common/entities/legal-document.entity';
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
  ) {}

  async getDocuments() {
    return this.legalDocumentRepository.find({
      where: { isActive: true },
      order: { createdAt: 'ASC' },
    });
  }

  async recordConsent(dto: RecordConsentDto) {
    const [appUser, document] = await Promise.all([
      this.appUserRepository.findOne({
        where: { email: dto.userEmail.toLowerCase() },
      }),
      this.legalDocumentRepository.findOne({
        where: { key: dto.documentKey, isActive: true },
      }),
    ]);

    if (!appUser) {
      throw new NotFoundException('User not found');
    }

    if (!document) {
      throw new NotFoundException('Legal document not found');
    }

    return this.consentRecordRepository.save(
      this.consentRecordRepository.create({
        appUserId: appUser.id,
        appUserEmail: appUser.email,
        documentId: document.id,
        documentKey: document.key,
        documentVersion: document.version,
        acceptedAt: new Date(),
      }),
    );
  }

  async getConsentSummary() {
    const [documents, consents] = await Promise.all([
      this.legalDocumentRepository.count({ where: { isActive: true } }),
      this.consentRecordRepository.count(),
    ]);

    return {
      activeDocuments: documents,
      consentRecords: consents,
    };
  }
}
