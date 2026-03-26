import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { MediaVerificationJob } from '../common/entities/media-verification-job.entity';
import { CreateMediaVerificationJobDto } from './dto/create-media-verification-job.dto';
import { MEDIA_VERIFICATION_SAMPLE_CATALOG } from './media-verification.samples';

@Injectable()
export class MediaVerificationService {
  constructor(
    private readonly auditService: AuditService,
    @InjectRepository(MediaVerificationJob)
    private readonly mediaVerificationJobRepository: Repository<MediaVerificationJob>,
  ) {}

  async create(
    dto: CreateMediaVerificationJobDto,
    actor: { subjectId: string; actorRole: string },
  ) {
    if (!['parent_guardian', 'therapist'].includes(actor.actorRole)) {
      throw new ForbiddenException('Actor is not allowed to request media verification');
    }

    const sample = MEDIA_VERIFICATION_SAMPLE_CATALOG[dto.sampleKey];
    if (!sample || sample.verificationType !== dto.verificationType) {
      throw new NotFoundException('Media verification sample not found');
    }

    const saved = await this.mediaVerificationJobRepository.save(
      this.mediaVerificationJobRepository.create({
        requestedByUserId: actor.subjectId,
        actorRole: actor.actorRole,
        verificationType: dto.verificationType,
        subjectRole: dto.subjectRole ?? actor.actorRole,
        subjectProfileId: dto.subjectProfileId ?? null,
        status: sample.reviewRequired ? 'review_required' : 'completed',
        sampleKey: dto.sampleKey,
        inputAssets: dto.inputAssets ?? sample.inputAssets,
        extractedData: {
          ...sample.extractedData,
          metadata: dto.metadata ?? null,
        },
        confidenceScore: sample.confidenceScore,
        matched: sample.matched ?? null,
        reviewRequired: sample.reviewRequired ?? false,
        notes: sample.notes,
      }),
    );

    await this.auditService.record('media_verification.created', {
      actorRole: actor.actorRole,
      actorUserId: actor.subjectId,
      resourceType: 'media_verification_job',
      resourceId: saved.id,
      outcome: 'success',
      severity: saved.reviewRequired ? 'medium' : 'low',
      metadata: {
        verificationType: saved.verificationType,
        sampleKey: saved.sampleKey ?? 'unknown',
      },
    });

    return saved;
  }

  async listForActor(actor: { subjectId: string; actorRole: string }) {
    return this.mediaVerificationJobRepository.find({
      where: { requestedByUserId: actor.subjectId },
      order: { createdAt: 'DESC' },
    });
  }

  async getById(id: string, actor: { subjectId: string; actorRole: string }) {
    const job = await this.mediaVerificationJobRepository.findOne({ where: { id } });
    if (!job || job.requestedByUserId !== actor.subjectId) {
      throw new NotFoundException('Media verification job not found');
    }

    return job;
  }

  async listAll() {
    return this.mediaVerificationJobRepository.find({
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }
}
