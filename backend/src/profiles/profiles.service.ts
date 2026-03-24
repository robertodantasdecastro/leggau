import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParentProfile } from '../common/entities/parent-profile.entity';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(ParentProfile)
    private readonly parentRepository: Repository<ParentProfile>,
  ) {}

  async getProfile(email?: string) {
    const resolvedEmail =
      email ??
      this.configService.get<string>('DEFAULT_PARENT_EMAIL') ??
      'parent@leggau.local';

    const parent = await this.parentRepository.findOne({
      where: { email: resolvedEmail },
    });

    return {
      parent,
      environment: {
        devApiBaseUrl:
          this.configService.get<string>('DEV_API_BASE_URL') ??
          'http://localhost:8080/api',
        prodApiBaseUrl:
          this.configService.get<string>('PROD_API_BASE_URL') ??
          'https://api.leggau.com',
      },
    };
  }
}
