import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParentProfile } from '../common/entities/parent-profile.entity';
import { DevLoginDto } from './dto/dev-login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(ParentProfile)
    private readonly parentRepository: Repository<ParentProfile>,
  ) {}

  async devLogin(dto: DevLoginDto) {
    let parent = await this.parentRepository.findOne({
      where: { email: dto.email },
    });

    if (!parent) {
      parent = await this.parentRepository.save(
        this.parentRepository.create({
          email: dto.email,
          name: dto.name ?? dto.email.split('@')[0],
          role: 'guardian',
        }),
      );
    }

    return {
      accessToken: `dev-token-${parent.id}`,
      parent,
    };
  }
}
