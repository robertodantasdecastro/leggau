import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChildProfile } from '../common/entities/child-profile.entity';
import { ParentProfile } from '../common/entities/parent-profile.entity';

@Injectable()
export class FamiliesService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(ParentProfile)
    private readonly parentRepository: Repository<ParentProfile>,
    @InjectRepository(ChildProfile)
    private readonly childRepository: Repository<ChildProfile>,
  ) {}

  async getOverview(email?: string) {
    const resolvedEmail =
      email ??
      this.configService.get<string>('DEFAULT_PARENT_EMAIL') ??
      'parent@leggau.local';

    const parent = await this.parentRepository.findOne({
      where: { email: resolvedEmail },
    });

    const children = parent
      ? await this.childRepository.find({ where: { parentId: parent.id } })
      : [];

    return {
      parent,
      children,
    };
  }
}
