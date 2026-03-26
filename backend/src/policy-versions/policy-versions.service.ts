import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PolicyVersion } from '../common/entities/policy-version.entity';
import { CreatePolicyVersionDto } from './dto/create-policy-version.dto';
import { UpdatePolicyVersionDto } from './dto/update-policy-version.dto';

@Injectable()
export class PolicyVersionsService {
  constructor(
    @InjectRepository(PolicyVersion)
    private readonly policyVersionRepository: Repository<PolicyVersion>,
  ) {}

  async list() {
    return this.policyVersionRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreatePolicyVersionDto) {
    return this.policyVersionRepository.save(
      this.policyVersionRepository.create({
        policyKey: dto.policyKey,
        version: dto.version,
        title: dto.title,
        audience: dto.audience,
        contentMarkdown: dto.contentMarkdown,
        status: 'published',
        publishedAt: new Date(),
      }),
    );
  }

  async update(id: string, dto: UpdatePolicyVersionDto) {
    const policy = await this.policyVersionRepository.findOne({ where: { id } });
    if (!policy) {
      throw new NotFoundException('Policy version not found');
    }

    policy.status = dto.status ?? policy.status;
    policy.supersededBy = dto.supersededBy ?? policy.supersededBy;
    return this.policyVersionRepository.save(policy);
  }
}

