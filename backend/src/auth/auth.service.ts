import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppUser } from '../common/entities/app-user.entity';
import { AuditEvent } from '../common/entities/audit-event.entity';
import { CareTeamMembership } from '../common/entities/care-team-membership.entity';
import { ConsentRecord } from '../common/entities/consent-record.entity';
import { GuardianLink } from '../common/entities/guardian-link.entity';
import { ParentProfile } from '../common/entities/parent-profile.entity';
import { PolicyVersion } from '../common/entities/policy-version.entity';
import { TherapistProfile } from '../common/entities/therapist-profile.entity';
import { SessionStoreService } from '../common/session-store.service';
import { IdentityProvidersService } from '../identity-providers/identity-providers.service';
import { DevLoginDto } from './dto/dev-login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { SocialLoginDto } from './dto/social-login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly sessionStoreService: SessionStoreService,
    private readonly identityProvidersService: IdentityProvidersService,
    @InjectRepository(AppUser)
    private readonly appUserRepository: Repository<AppUser>,
    @InjectRepository(ParentProfile)
    private readonly parentRepository: Repository<ParentProfile>,
    @InjectRepository(TherapistProfile)
    private readonly therapistRepository: Repository<TherapistProfile>,
    @InjectRepository(AuditEvent)
    private readonly auditEventRepository: Repository<AuditEvent>,
    @InjectRepository(PolicyVersion)
    private readonly policyVersionRepository: Repository<PolicyVersion>,
    @InjectRepository(ConsentRecord)
    private readonly consentRecordRepository: Repository<ConsentRecord>,
    @InjectRepository(GuardianLink)
    private readonly guardianLinkRepository: Repository<GuardianLink>,
    @InjectRepository(CareTeamMembership)
    private readonly careTeamRepository: Repository<CareTeamMembership>,
  ) {}

  async register(dto: RegisterDto) {
    const normalizedRole = dto.role ?? 'parent_guardian';
    if (!['parent_guardian', 'therapist'].includes(normalizedRole)) {
      throw new BadRequestException('Unsupported self-register role');
    }

    const existingUser = await this.appUserRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const { passwordHash, passwordSalt } = this.hashPassword(dto.password);

    const appUser = await this.appUserRepository.save(
      this.appUserRepository.create({
        email: dto.email.toLowerCase(),
        displayName:
          dto.displayName ??
          this.resolveDraftName(dto.profileDraft) ??
          dto.email.split('@')[0],
        passwordHash,
        passwordSalt,
        role: normalizedRole,
      }),
    );

    const profilePayload = await this.resolveProfilesForUser(appUser);
    const session = await this.sessionStoreService.createSession(
      'app',
      appUser.id,
      appUser.email,
      appUser.role,
    );
    await this.recordAudit('auth.register', appUser.role, appUser.id, 'app_user', appUser.id, {
      email: appUser.email,
    });

    return {
      ...session,
      user: this.serializeUser(appUser),
      parent: profilePayload.parent,
      profile: profilePayload.profile,
      actorRole: appUser.role,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.appUserRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !this.verifyPassword(dto.password, user.passwordSalt, user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const profilePayload = await this.resolveProfilesForUser(user);
    const session = await this.sessionStoreService.createSession(
      'app',
      user.id,
      user.email,
      user.role,
    );
    await this.recordAudit('auth.login', user.role, user.id, 'app_user', user.id, {
      email: user.email,
    });

    return {
      ...session,
      user: this.serializeUser(user),
      parent: profilePayload.parent,
      profile: profilePayload.profile,
      actorRole: user.role,
    };
  }

  async listSocialProviders() {
    return this.identityProvidersService.listPublicProviders();
  }

  async socialLogin(dto: SocialLoginDto) {
    const requestedRole = dto.role ?? 'parent_guardian';
    if (!['parent_guardian', 'therapist'].includes(requestedRole)) {
      throw new BadRequestException('Unsupported social login role');
    }

    const assertion = await this.identityProvidersService.verifyAssertion({
      provider: dto.provider,
      idToken: dto.idToken,
      mockSubject: dto.mockSubject,
      displayName: dto.displayName ?? this.resolveDraftName(dto.profileDraft) ?? undefined,
    });

    if (!assertion.emailVerified) {
      throw new ForbiddenException('Verified email is required for social login');
    }

    if (!assertion.email) {
      throw new BadRequestException('Provider did not return a usable email');
    }

    let externalIdentity = await this.identityProvidersService.findExternalIdentity(
      assertion.provider,
      assertion.providerSubject,
    );

    let user =
      externalIdentity &&
      (await this.appUserRepository.findOne({
        where: { id: externalIdentity.appUserId },
      }));

    if (!user) {
      user = await this.appUserRepository.findOne({
        where: { email: assertion.email },
      });
    }

    const isNewUser = !user;
    if (!user) {
      user = await this.createUserFromSocialProfile(assertion.email, requestedRole, {
        displayName:
          assertion.displayName ??
          this.resolveDraftName(dto.profileDraft) ??
          assertion.email.split('@')[0],
      });
    } else if (user.role !== requestedRole) {
      throw new ConflictException(
        `Existing account role mismatch: expected ${user.role}, received ${requestedRole}`,
      );
    }

    externalIdentity = await this.identityProvidersService.upsertExternalIdentity({
      appUserId: user.id,
      provider: assertion.provider,
      providerSubject: assertion.providerSubject,
      providerConfigId: assertion.providerConfigId,
      email: assertion.email,
      emailVerified: assertion.emailVerified,
      displayName: assertion.displayName ?? null,
      avatarUrl: assertion.avatarUrl ?? null,
      rawClaims: assertion.rawClaims,
    });

    const profilePayload = await this.resolveProfilesForUser(user);
    const session = await this.sessionStoreService.createSession(
      'app',
      user.id,
      user.email,
      user.role,
    );
    const requirements = await this.buildActorRequirements(user);
    await this.recordAudit(
      isNewUser ? 'auth.social_register' : 'auth.social_login',
      user.role,
      user.id,
      'external_identity',
      externalIdentity.id,
      {
        provider: assertion.provider,
        emailVerified: assertion.emailVerified,
      },
    );

    return {
      ...session,
      authMethod: 'social',
      identityProvider: assertion.provider,
      identity: {
        id: externalIdentity.id,
        provider: externalIdentity.provider,
        providerSubject: externalIdentity.providerSubject,
      },
      requirements,
      user: this.serializeUser(user),
      parent: profilePayload.parent,
      profile: profilePayload.profile,
      actorRole: user.role,
    };
  }

  async refresh(dto: RefreshDto) {
    const session =
      (await this.sessionStoreService.getSessionByRefreshToken(dto.token, 'app')) ??
      (await this.sessionStoreService.getSession(dto.token, 'app'));

    if (!session || session.scope !== 'app') {
      throw new UnauthorizedException('Invalid session');
    }

    await this.sessionStoreService.revokeSession(dto.token);
    const user = await this.appUserRepository.findOne({
      where: { id: session.subjectId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profilePayload = await this.resolveProfilesForUser(user);
    const refreshedSession = await this.sessionStoreService.createSession(
      'app',
      session.subjectId,
      session.email,
      session.actorRole,
    );
    await this.recordAudit('auth.refresh', session.actorRole, session.subjectId, 'session', dto.token, {
      refreshedFrom: dto.token,
    });

    return {
      ...refreshedSession,
      refreshedFrom: dto.token,
      user: this.serializeUser(user),
      parent: profilePayload.parent,
      profile: profilePayload.profile,
      actorRole: session.actorRole,
    };
  }

  async logout(dto: LogoutDto) {
    const session =
      (await this.sessionStoreService.getSession(dto.token, 'app')) ??
      (await this.sessionStoreService.getSessionByRefreshToken(dto.token, 'app'));
    const revoked = await this.sessionStoreService.revokeSession(dto.token);

    if (session && revoked) {
      await this.recordAudit(
        'auth.logout',
        session.actorRole,
        session.subjectId,
        'session',
        session.sessionId ?? dto.token,
      );
    }

    return {
      revoked,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.appUserRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resetToken = await this.sessionStoreService.issueResetToken(user.id, user.email);
    await this.recordAudit(
      'auth.password_reset_requested',
      user.role,
      user.id,
      'password_reset',
      resetToken.token,
    );

    return {
      sent: true,
      channel: 'email-sandbox',
      resetToken,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const record = await this.sessionStoreService.consumeResetToken(dto.token);
    if (!record) {
      throw new UnauthorizedException('Invalid reset token');
    }

    const user = await this.appUserRepository.findOne({
      where: { id: record.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash, passwordSalt } = this.hashPassword(dto.newPassword);
    user.passwordHash = passwordHash;
    user.passwordSalt = passwordSalt;
    await this.appUserRepository.save(user);
    await this.recordAudit(
      'auth.password_reset_completed',
      user.role,
      user.id,
      'password_reset',
      record.token,
    );

    return {
      reset: true,
      user: this.serializeUser(user),
    };
  }

  async devLogin(dto: DevLoginDto) {
    const email = dto.email.toLowerCase();
    let user = await this.appUserRepository.findOne({
      where: { email },
    });

    if (!user) {
      const { passwordHash, passwordSalt } = this.hashPassword(
        `dev-login-${email}-${Date.now()}`,
      );
      user = await this.appUserRepository.save(
        this.appUserRepository.create({
          email,
          displayName: dto.name ?? email.split('@')[0],
          passwordHash,
          passwordSalt,
          role: 'parent_guardian',
        }),
      );
    }

    let parent = await this.parentRepository.findOne({
      where: { email },
    });

    if (!parent) {
      parent = await this.parentRepository.save(
        this.parentRepository.create({
          appUserId: user.id,
          email,
          name: dto.name ?? user.displayName,
          role: 'parent_guardian',
        }),
      );
    } else if (parent.appUserId !== user.id) {
      parent.appUserId = user.id;
      parent = await this.parentRepository.save(parent);
    }

    const session = await this.sessionStoreService.createSession(
      'app',
      user.id,
      user.email,
      user.role,
    );
    await this.recordAudit('auth.dev_login', user.role, user.id, 'app_user', user.id, {
      email: user.email,
    });

    return {
      ...session,
      user: this.serializeUser(user),
      parent,
      profile: parent,
      actorRole: user.role,
    };
  }

  private hashPassword(password: string) {
    const passwordSalt = randomBytes(16).toString('hex');
    const passwordHash = scryptSync(password, passwordSalt, 64).toString('hex');

    return {
      passwordHash,
      passwordSalt,
    };
  }

  private async createUserFromSocialProfile(
    email: string,
    role: string,
    options: { displayName: string },
  ) {
    const { passwordHash, passwordSalt } = this.hashPassword(
      `social-login-${role}-${email}-${Date.now()}`,
    );

    return this.appUserRepository.save(
      this.appUserRepository.create({
        email,
        displayName: options.displayName,
        passwordHash,
        passwordSalt,
        role,
      }),
    );
  }

  private verifyPassword(password: string, salt: string, hash: string) {
    const derived = scryptSync(password, salt, 64);
    const existing = Buffer.from(hash, 'hex');

    return existing.length === derived.length && timingSafeEqual(derived, existing);
  }

  private serializeUser(user: AppUser) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      isActive: user.isActive,
    };
  }

  private resolveDraftName(
    profileDraft?: Record<string, string | number | boolean | null>,
  ) {
    if (!profileDraft) {
      return null;
    }

    const name = profileDraft.name ?? profileDraft.displayName;
    return typeof name === 'string' && name.trim() ? name.trim() : null;
  }

  private async resolveProfilesForUser(user: AppUser) {
    if (user.role === 'parent_guardian') {
      const parent = await this.ensureParentProfile(user);
      return {
        parent,
        profile: parent,
      };
    }

    if (user.role === 'therapist') {
      const therapist = await this.ensureTherapistProfile(user);
      return {
        parent: null,
        profile: therapist,
      };
    }

    return {
      parent: null,
      profile: null,
    };
  }

  private async buildActorRequirements(user: AppUser) {
    const audiences =
      user.role === 'parent_guardian'
        ? ['parent_guardian', 'parent', 'all']
        : [user.role, 'all'];
    const requiredPolicies = await this.policyVersionRepository.find({
      where: audiences.map((audience) => ({
        status: 'published',
        audience,
      })),
      order: { publishedAt: 'DESC', createdAt: 'DESC' },
    });

    const acceptedPolicyIds = new Set(
      (
        await this.consentRecordRepository.find({
          where: {
            appUserId: user.id,
            status: 'accepted',
          },
          order: { acceptedAt: 'DESC' },
        })
      )
        .map((record) => record.policyVersionId)
        .filter((value): value is string => Boolean(value)),
    );

    const missingPolicies = requiredPolicies.filter(
      (policy) => !acceptedPolicyIds.has(policy.id),
    );

    const [activeGuardianLinks, activeCareTeamMemberships, therapistProfile] =
      await Promise.all([
        user.role === 'parent_guardian'
          ? this.guardianLinkRepository.count({
              where: {
                parentUserId: user.id,
                status: 'active',
              },
            })
          : Promise.resolve(0),
        user.role === 'therapist'
          ? this.careTeamRepository.count({
              where: {
                therapistUserId: user.id,
                status: 'active',
              },
            })
          : Promise.resolve(0),
        user.role === 'therapist'
          ? this.therapistRepository.findOne({ where: { appUserId: user.id } })
          : Promise.resolve(null),
      ]);

    return {
      legalConsentRequired: missingPolicies.length > 0,
      missingPolicies: missingPolicies.map((policy) => ({
        id: policy.id,
        key: policy.policyKey,
        version: policy.version,
        title: policy.title,
      })),
      actorDependencies: {
        activeGuardianLinks,
        activeCareTeamMemberships,
        therapistAdminApproved:
          therapistProfile?.adminApprovalStatus === 'approved',
      },
    };
  }

  private async ensureParentProfile(user: AppUser) {
    let parent = await this.parentRepository.findOne({
      where: [{ appUserId: user.id }, { email: user.email }],
    });

    if (!parent) {
      parent = this.parentRepository.create({
        appUserId: user.id,
        email: user.email,
        name: user.displayName,
        role: 'parent_guardian',
      });
    } else {
      parent.appUserId = user.id;
      parent.name = parent.name || user.displayName;
      parent.role = 'parent_guardian';
    }

    return this.parentRepository.save(parent);
  }

  private async ensureTherapistProfile(user: AppUser) {
    let therapist = await this.therapistRepository.findOne({
      where: [{ appUserId: user.id }, { email: user.email }],
    });

    if (!therapist) {
      therapist = this.therapistRepository.create({
        appUserId: user.id,
        email: user.email,
        name: user.displayName,
        role: 'therapist',
        adminApprovalStatus: 'pending',
        isActive: true,
      });
    } else {
      therapist.appUserId = user.id;
      therapist.name = therapist.name || user.displayName;
    }

    return this.therapistRepository.save(therapist);
  }

  private async recordAudit(
    eventType: string,
    actorRole: string,
    actorUserId: string,
    resourceType: string,
    resourceId?: string | null,
    metadata?: Record<string, string | number | boolean | null>,
  ) {
    await this.auditEventRepository.save(
      this.auditEventRepository.create({
        eventType,
        actorRole,
        actorUserId,
        resourceType,
        resourceId: resourceId ?? null,
        outcome: 'success',
        severity: 'low',
        metadata: metadata ?? null,
      }),
    );
  }
}
