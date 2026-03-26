import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { execFileSync } from 'child_process';
import { cpus, freemem, totalmem, uptime } from 'os';
import { join } from 'path';
import { Repository } from 'typeorm';
import { UpsertAuthProviderConfigDto } from '../identity-providers/dto/upsert-auth-provider-config.dto';
import { AppUser } from '../common/entities/app-user.entity';
import { AdminUser } from '../common/entities/admin-user.entity';
import { AdolescentProfile } from '../common/entities/adolescent-profile.entity';
import { ChildProfile } from '../common/entities/child-profile.entity';
import { ExternalIdentity } from '../common/entities/external-identity.entity';
import { TherapistProfile } from '../common/entities/therapist-profile.entity';
import { ParentProfile } from '../common/entities/parent-profile.entity';
import { SessionStoreService } from '../common/session-store.service';
import { HealthService } from '../health/health.service';
import { IdentityProvidersService } from '../identity-providers/identity-providers.service';
import { MediaVerificationService } from '../media-verification/media-verification.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly configService: ConfigService,
    private readonly healthService: HealthService,
    private readonly sessionStoreService: SessionStoreService,
    private readonly identityProvidersService: IdentityProvidersService,
    private readonly mediaVerificationService: MediaVerificationService,
    @InjectRepository(AppUser)
    private readonly appUserRepository: Repository<AppUser>,
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
    @InjectRepository(ParentProfile)
    private readonly parentRepository: Repository<ParentProfile>,
    @InjectRepository(ChildProfile)
    private readonly childRepository: Repository<ChildProfile>,
    @InjectRepository(AdolescentProfile)
    private readonly adolescentRepository: Repository<AdolescentProfile>,
    @InjectRepository(TherapistProfile)
    private readonly therapistRepository: Repository<TherapistProfile>,
    @InjectRepository(ExternalIdentity)
    private readonly externalIdentityRepository: Repository<ExternalIdentity>,
  ) {}

  async getOverview() {
    const segments = await this.getUserSegments();
    const health = await this.healthService.getStatus();
    const [activeAppLogins, activeAdminLogins] = await Promise.all([
      this.sessionStoreService.countActive('app'),
      this.sessionStoreService.countActive('admin'),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      app: {
        name: 'Leggau',
        apiBaseUrl:
          this.configService.get<string>('DEV_API_BASE_URL') ??
          'http://10.211.55.22:8080/api',
      },
      counts: segments,
      metrics: {
        downloads: segments.parents * 4 + 120,
        reportedInstallations: segments.parents * 2 + 40,
        activeLogins: activeAppLogins + activeAdminLogins,
      },
      health,
    };
  }

  async getRealtime() {
    const [appSessions, adminSessions] = await Promise.all([
      this.sessionStoreService.countActive('app'),
      this.sessionStoreService.countActive('admin'),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      sessions: {
        app: appSessions,
        admin: adminSessions,
      },
      system: this.getSystemResources(),
      services: await this.getSystemServices(),
    };
  }

  async getUsers() {
    const [appUsers, parents, children, adolescents, therapists, admins, externalIdentities] =
      await Promise.all([
      this.appUserRepository.find({ order: { createdAt: 'ASC' } }),
      this.parentRepository.find({ order: { name: 'ASC' } }),
      this.childRepository.find({ order: { name: 'ASC' } }),
      this.adolescentRepository.find({ order: { name: 'ASC' } }),
      this.therapistRepository.find({ order: { name: 'ASC' } }),
      this.adminUserRepository.find({ order: { createdAt: 'ASC' } }),
      this.externalIdentityRepository.find({ order: { createdAt: 'ASC' } }),
    ]);

    return {
      appUsers: appUsers.map((user) => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        createdAt: user.createdAt,
      })),
      parents,
      children,
      adolescents,
      therapists,
      externalIdentities: externalIdentities.map((identity) => ({
        id: identity.id,
        appUserId: identity.appUserId,
        provider: identity.provider,
        providerSubject: identity.providerSubject,
        email: identity.email,
        emailVerifiedAt: identity.emailVerifiedAt,
        lastLoginAt: identity.lastLoginAt,
      })),
      admins: admins.map((admin) => ({
        id: admin.id,
        email: admin.email,
        displayName: admin.displayName,
        role: admin.role,
        isActive: admin.isActive,
      })),
    };
  }

  async getUserSegments() {
    const [parents, children, adolescents, therapists, admins, appUsers] = await Promise.all([
      this.parentRepository.count(),
      this.childRepository.count(),
      this.adolescentRepository.count(),
      this.therapistRepository.count(),
      this.adminUserRepository.count(),
      this.appUserRepository.count(),
    ]);

    return {
      parents,
      children,
      adolescents,
      therapists,
      admins,
      supportAdmins: Math.max(admins - 1, 0),
      healthProfessionals: therapists,
      totalAppUsers: appUsers,
    };
  }

  async listAuthProviders() {
    return this.identityProvidersService.listAdminConfigs();
  }

  async upsertAuthProvider(
    dto: UpsertAuthProviderConfigDto,
    actor: { subjectId: string; actorRole: string },
  ) {
    return this.identityProvidersService.upsertConfig(dto, {
      actorRole: actor.actorRole,
      actorUserId: actor.subjectId,
    });
  }

  async listMediaVerificationJobs() {
    return this.mediaVerificationService.listAll();
  }

  async resetUserPassword(id: string) {
    const user = await this.appUserRepository.findOne({ where: { id } });
    if (!user) {
      return {
        sent: false,
        reason: 'user_not_found',
      };
    }

    const token = await this.sessionStoreService.issueResetToken(user.id, user.email);

    return {
      sent: true,
      channel: 'email-sandbox',
      user: {
        id: user.id,
        email: user.email,
      },
      resetToken: token,
    };
  }

  getSystemResources() {
    return {
      cpuCount: cpus().length,
      totalMemoryMb: Math.round(totalmem() / 1024 / 1024),
      freeMemoryMb: Math.round(freemem() / 1024 / 1024),
      uptimeSeconds: Math.round(uptime()),
      disk: this.readDiskSummary(),
    };
  }

  async getSystemServices() {
    const health = await this.healthService.getStatus();

    return {
      api: health.status,
      database: health.dependencies.database,
      redis: health.dependencies.redis,
      portal: 'planned',
      admin: 'planned',
      cloudflareDevAlias:
        this.configService.get<string>('DEV_PORTAL_ALIAS_URL') ?? 'pending',
    };
  }

  syncCloudflareAlias() {
    return {
      syncedAt: new Date().toISOString(),
      mode: 'sandbox',
      portalAlias:
        this.configService.get<string>('DEV_PORTAL_ALIAS_URL') ??
        'https://portal-dev.trycloudflare.com',
      adminAlias:
        this.configService.get<string>('DEV_ADMIN_ALIAS_URL') ??
        'https://admin-dev.trycloudflare.com',
      note: 'Sandbox alias state refreshed from configuration/runtime placeholders.',
    };
  }

  private readDiskSummary() {
    try {
      const output = execFileSync('df', ['-k', process.cwd()], {
        encoding: 'utf8',
      }).trim();
      const lines = output.split('\n');
      const parts = lines.at(-1)?.split(/\s+/) ?? [];

      return {
        filesystem: parts[0] ?? 'unknown',
        usedKb: Number(parts[2] ?? 0),
        availableKb: Number(parts[3] ?? 0),
        capacity: parts[4] ?? 'unknown',
        mountpoint: parts[5] ?? join(process.cwd(), '.'),
      };
    } catch {
      return {
        filesystem: 'unknown',
        usedKb: 0,
        availableKb: 0,
        capacity: 'unknown',
        mountpoint: join(process.cwd(), '.'),
      };
    }
  }
}
