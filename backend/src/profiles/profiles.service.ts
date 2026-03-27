import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppUser } from '../common/entities/app-user.entity';
import { ParentProfile } from '../common/entities/parent-profile.entity';
import { TherapistProfile } from '../common/entities/therapist-profile.entity';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(AppUser)
    private readonly appUserRepository: Repository<AppUser>,
    @InjectRepository(ParentProfile)
    private readonly parentRepository: Repository<ParentProfile>,
    @InjectRepository(TherapistProfile)
    private readonly therapistRepository: Repository<TherapistProfile>,
  ) {}

  async getProfile(email?: string) {
    const resolvedEmail =
      email ??
      this.configService.get<string>('DEFAULT_PARENT_EMAIL') ??
      'parent@leggau.local';

    const [user, parent, therapist] = await Promise.all([
      this.appUserRepository.findOne({
        where: { email: resolvedEmail },
      }),
      this.parentRepository.findOne({
        where: { email: resolvedEmail },
      }),
      this.therapistRepository.findOne({
        where: { email: resolvedEmail },
      }),
    ]);

    const actorRole = user?.role ?? parent?.role ?? therapist?.role ?? null;
    const profile = actorRole === 'therapist' ? therapist : parent;

    return {
      parent,
      user: user
        ? {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            isActive: user.isActive,
          }
        : null,
      profile,
      actorRole,
      environment: {
        devApiBaseUrl:
          this.configService.get<string>('DEV_API_ALIAS_URL') ??
          this.configService.get<string>('DEV_API_BASE_URL') ??
          'http://10.211.55.22:8080/api',
        prodApiBaseUrl:
          this.configService.get<string>('PROD_API_BASE_URL') ??
          'https://api.leggau.com',
      },
    };
  }
}
