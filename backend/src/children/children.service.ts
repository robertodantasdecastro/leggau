import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChildProfile } from '../common/entities/child-profile.entity';
import { ParentProfile } from '../common/entities/parent-profile.entity';
import { CreateChildDto } from './dto/create-child.dto';

@Injectable()
export class ChildrenService {
  constructor(
    @InjectRepository(ParentProfile)
    private readonly parentRepository: Repository<ParentProfile>,
    @InjectRepository(ChildProfile)
    private readonly childRepository: Repository<ChildProfile>,
  ) {}

  async create(dto: CreateChildDto) {
    const normalizedEmail = dto.parentEmail?.trim().toLowerCase();
    const parent = await this.parentRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    const child = await this.childRepository.save(
      this.childRepository.create({
        parentId: parent.id,
        name: dto.name?.trim() || 'Explorador Gau',
        age: Math.max(1, dto.age ?? 6),
        avatar: dto.avatar?.trim() || 'gau-rounded-pixel',
      }),
    );

    return child;
  }
}
