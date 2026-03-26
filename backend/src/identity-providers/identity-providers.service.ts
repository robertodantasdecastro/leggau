import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  JsonWebKey,
  createCipheriv,
  createDecipheriv,
  createHash,
  createPublicKey,
  randomBytes,
  verify,
} from 'crypto';
import { Repository } from 'typeorm';
import { AuditEvent } from '../common/entities/audit-event.entity';
import { AuthProviderConfig } from '../common/entities/auth-provider-config.entity';
import { ExternalIdentity } from '../common/entities/external-identity.entity';
import { UpsertAuthProviderConfigDto } from './dto/upsert-auth-provider-config.dto';

type SocialAssertionInput = {
  provider: string;
  idToken?: string;
  mockSubject?: string;
  displayName?: string;
};

type SocialAssertionPayload = {
  provider: string;
  providerConfigId: string;
  providerSubject: string;
  email?: string | null;
  emailVerified: boolean;
  displayName?: string | null;
  avatarUrl?: string | null;
  rawClaims: Record<string, unknown>;
};

type JwtHeader = {
  alg?: string;
  kid?: string;
  typ?: string;
};

type JwtPayload = Record<string, unknown> & {
  aud?: string | string[];
  iss?: string;
  exp?: number;
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
  name?: string;
  picture?: string;
};

@Injectable()
export class IdentityProvidersService {
  private readonly jwksCache = new Map<string, { expiresAt: number; keys: Array<Record<string, unknown>> }>();

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(AuthProviderConfig)
    private readonly providerConfigRepository: Repository<AuthProviderConfig>,
    @InjectRepository(ExternalIdentity)
    private readonly externalIdentityRepository: Repository<ExternalIdentity>,
    @InjectRepository(AuditEvent)
    private readonly auditEventRepository: Repository<AuditEvent>,
  ) {}

  async listAdminConfigs() {
    const configs = await this.providerConfigRepository.find({
      order: { provider: 'ASC' },
    });

    return configs.map((config) => this.serializeAdminConfig(config));
  }

  async upsertConfig(dto: UpsertAuthProviderConfigDto, actor?: { actorRole?: string; actorUserId?: string }) {
    const provider = dto.provider.toLowerCase();
    let config = await this.providerConfigRepository.findOne({
      where: { provider },
    });

    if (!config) {
      config = this.providerConfigRepository.create({
        provider,
        displayName: provider === 'google' ? 'Google' : 'Apple',
      });
    }

    config.displayName = dto.displayName ?? config.displayName;
    config.enabled = dto.enabled ?? config.enabled ?? false;
    config.verificationMode = dto.verificationMode ?? config.verificationMode ?? 'mock';
    config.clientId = dto.clientId ?? config.clientId ?? null;
    config.issuer = dto.issuer ?? config.issuer ?? this.defaultIssuerFor(provider);
    config.jwksUrl = dto.jwksUrl ?? config.jwksUrl ?? this.defaultJwksUrlFor(provider);
    config.allowedAudiences =
      dto.allowedAudiences ??
      config.allowedAudiences ??
      (config.clientId ? [config.clientId] : []);
    config.scopes = dto.scopes ?? config.scopes ?? ['openid', 'email', 'profile'];
    config.metadata = dto.metadata ?? config.metadata ?? null;

    if (dto.clientSecret !== undefined) {
      config.clientSecretEncrypted = dto.clientSecret
        ? this.encrypt(dto.clientSecret)
        : null;
    }

    if (dto.privateKey !== undefined) {
      config.privateKeyEncrypted = dto.privateKey
        ? this.encrypt(dto.privateKey)
        : null;
    }

    const saved = await this.providerConfigRepository.save(config);

    await this.auditEventRepository.save(
      this.auditEventRepository.create({
        eventType: 'auth_provider.updated',
        actorRole: actor?.actorRole ?? 'admin',
        actorUserId: actor?.actorUserId ?? null,
        resourceType: 'auth_provider_config',
        resourceId: saved.id,
        outcome: 'success',
        severity: 'medium',
        metadata: {
          provider: saved.provider,
          enabled: saved.enabled,
          verificationMode: saved.verificationMode,
        },
      }),
    );

    return this.serializeAdminConfig(saved);
  }

  async listPublicProviders() {
    const configs = await this.providerConfigRepository.find({
      where: { enabled: true },
      order: { provider: 'ASC' },
    });

    return configs.map((config) => ({
      provider: config.provider,
      displayName: config.displayName,
      clientId: config.clientId,
      scopes: config.scopes ?? ['openid', 'email', 'profile'],
    }));
  }

  async verifyAssertion(input: SocialAssertionInput): Promise<SocialAssertionPayload> {
    const config = await this.providerConfigRepository.findOne({
      where: { provider: input.provider.toLowerCase() },
    });

    if (!config || !config.enabled) {
      throw new ForbiddenException('Identity provider is not enabled');
    }

    if (config.verificationMode === 'mock') {
      return this.resolveMockAssertion(config, input);
    }

    if (!input.idToken) {
      throw new BadRequestException('Missing social id token');
    }

    const { header, payload, signatureInput, signature } = this.decodeJwt(input.idToken);

    if (!payload.sub) {
      throw new BadRequestException('Provider assertion missing subject');
    }

    this.assertIssuer(config, payload.iss);
    this.assertAudience(config, payload.aud);
    this.assertExpiration(payload.exp);
    await this.assertJwtSignature(config, header, signatureInput, signature);

    const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : null;

    return {
      provider: config.provider,
      providerConfigId: config.id,
      providerSubject: payload.sub,
      email,
      emailVerified: this.resolveEmailVerified(payload.email_verified),
      displayName:
        (typeof payload.name === 'string' && payload.name.trim()) ||
        input.displayName ||
        (email ? email.split('@')[0] : null),
      avatarUrl: typeof payload.picture === 'string' ? payload.picture : null,
      rawClaims: payload,
    };
  }

  async findExternalIdentity(provider: string, providerSubject: string) {
    return this.externalIdentityRepository.findOne({
      where: {
        provider,
        providerSubject,
      },
    });
  }

  async upsertExternalIdentity(input: {
    appUserId: string;
    provider: string;
    providerSubject: string;
    providerConfigId?: string | null;
    email?: string | null;
    emailVerified?: boolean;
    displayName?: string | null;
    avatarUrl?: string | null;
    rawClaims?: Record<string, unknown>;
  }) {
    let identity = await this.externalIdentityRepository.findOne({
      where: {
        provider: input.provider,
        providerSubject: input.providerSubject,
      },
    });

    if (!identity) {
      identity = this.externalIdentityRepository.create({
        provider: input.provider,
        providerSubject: input.providerSubject,
      });
    }

    identity.appUserId = input.appUserId;
    identity.providerConfigId = input.providerConfigId ?? null;
    identity.email = input.email ?? null;
    identity.displayName = input.displayName ?? null;
    identity.avatarUrl = input.avatarUrl ?? null;
    identity.emailVerifiedAt = input.emailVerified ? new Date() : identity.emailVerifiedAt ?? null;
    identity.lastLoginAt = new Date();
    identity.profileSnapshot = input.rawClaims ?? null;

    return this.externalIdentityRepository.save(identity);
  }

  private serializeAdminConfig(config: AuthProviderConfig) {
    return {
      id: config.id,
      provider: config.provider,
      displayName: config.displayName,
      enabled: config.enabled,
      verificationMode: config.verificationMode,
      clientId: config.clientId,
      issuer: config.issuer,
      jwksUrl: config.jwksUrl,
      allowedAudiences: config.allowedAudiences ?? [],
      scopes: config.scopes ?? [],
      metadata: config.metadata ?? {},
      credentialSummary: {
        hasClientSecret: Boolean(config.clientSecretEncrypted),
        hasPrivateKey: Boolean(config.privateKeyEncrypted),
        maskedClientSecret: this.maskEncryptedSecret(config.clientSecretEncrypted),
        maskedPrivateKey: this.maskEncryptedSecret(config.privateKeyEncrypted),
      },
    };
  }

  private resolveMockAssertion(
    config: AuthProviderConfig,
    input: SocialAssertionInput,
  ): SocialAssertionPayload {
    const mockProfiles = Array.isArray(config.metadata?.mockProfiles)
      ? (config.metadata?.mockProfiles as Array<Record<string, unknown>>)
      : [];
    const providerSubject =
      input.mockSubject ??
      (input.idToken?.startsWith('mock:') ? input.idToken.slice('mock:'.length) : null);

    if (!providerSubject) {
      throw new BadRequestException('Missing mock subject for provider simulation');
    }

    const profile = mockProfiles.find((candidate) => candidate.subject === providerSubject);
    if (!profile) {
      throw new NotFoundException('Mock profile not configured for provider');
    }

    const email =
      typeof profile.email === 'string' ? profile.email.toLowerCase() : undefined;

    return {
      provider: config.provider,
      providerConfigId: config.id,
      providerSubject,
      email,
      emailVerified: profile.emailVerified !== false,
      displayName:
        (typeof profile.name === 'string' && profile.name.trim()
          ? profile.name
          : input.displayName ?? (email ? email.split('@')[0] : null)),
      avatarUrl:
        typeof profile.avatarUrl === 'string' ? profile.avatarUrl : null,
      rawClaims: profile,
    };
  }

  private defaultIssuerFor(provider: string) {
    if (provider === 'apple') {
      return 'https://appleid.apple.com';
    }

    return 'https://accounts.google.com';
  }

  private defaultJwksUrlFor(provider: string) {
    if (provider === 'apple') {
      return 'https://appleid.apple.com/auth/keys';
    }

    return 'https://www.googleapis.com/oauth2/v3/certs';
  }

  private encrypt(value: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.secretKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  }

  private decrypt(value?: string | null) {
    if (!value) {
      return null;
    }

    const payload = Buffer.from(value, 'base64');
    const iv = payload.subarray(0, 12);
    const tag = payload.subarray(12, 28);
    const encrypted = payload.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', this.secretKey(), iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }

  private secretKey() {
    const seed =
      this.configService.get<string>('AUTH_PROVIDER_SECRET_KEY') ??
      this.configService.get<string>('DEFAULT_ADMIN_PASSWORD') ??
      'leggau-dev-auth-provider-secret';

    return createHash('sha256').update(seed).digest();
  }

  private maskEncryptedSecret(value?: string | null) {
    const decrypted = this.decrypt(value);
    if (!decrypted) {
      return null;
    }

    if (decrypted.length <= 4) {
      return '****';
    }

    return `${'*'.repeat(Math.max(decrypted.length - 4, 4))}${decrypted.slice(-4)}`;
  }

  private decodeJwt(token: string) {
    const [headerSegment, payloadSegment, signatureSegment] = token.split('.');
    if (!headerSegment || !payloadSegment || !signatureSegment) {
      throw new BadRequestException('Invalid JWT assertion');
    }

    const header = JSON.parse(
      Buffer.from(this.base64urlToBase64(headerSegment), 'base64').toString('utf8'),
    ) as JwtHeader;
    const payload = JSON.parse(
      Buffer.from(this.base64urlToBase64(payloadSegment), 'base64').toString('utf8'),
    ) as JwtPayload;

    return {
      header,
      payload,
      signatureInput: `${headerSegment}.${payloadSegment}`,
      signature: Buffer.from(this.base64urlToBase64(signatureSegment), 'base64'),
    };
  }

  private base64urlToBase64(value: string) {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    return normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  }

  private resolveEmailVerified(value: boolean | string | undefined) {
    return value === true || value === 'true';
  }

  private assertIssuer(config: AuthProviderConfig, issuer?: string) {
    const allowedIssuers = new Set<string>();
    if (config.issuer) {
      allowedIssuers.add(config.issuer);
    }

    if (config.provider === 'google') {
      allowedIssuers.add('https://accounts.google.com');
      allowedIssuers.add('accounts.google.com');
    }

    if (!issuer || !allowedIssuers.has(issuer)) {
      throw new ForbiddenException('Invalid provider issuer');
    }
  }

  private assertAudience(config: AuthProviderConfig, audience?: string | string[]) {
    const audiences = Array.isArray(audience) ? audience : audience ? [audience] : [];
    const allowed = new Set<string>([
      ...(config.allowedAudiences ?? []),
      ...(config.clientId ? [config.clientId] : []),
    ]);

    if (allowed.size === 0) {
      throw new BadRequestException('Provider audiences are not configured');
    }

    const hasMatch = audiences.some((candidate) => allowed.has(candidate));
    if (!hasMatch) {
      throw new ForbiddenException('Provider audience is not allowed');
    }
  }

  private assertExpiration(exp?: number) {
    if (!exp) {
      throw new ForbiddenException('Provider assertion missing expiration');
    }

    if (exp * 1000 <= Date.now()) {
      throw new ForbiddenException('Provider assertion is expired');
    }
  }

  private async assertJwtSignature(
    config: AuthProviderConfig,
    header: JwtHeader,
    signatureInput: string,
    signature: Buffer,
  ) {
    if (header.alg !== 'RS256' || !header.kid) {
      throw new ForbiddenException('Unsupported provider signature algorithm');
    }

    const jwks = await this.fetchJwks(config);
    const match = jwks.find(
      (candidate) =>
        candidate.kid === header.kid &&
        candidate.kty === 'RSA' &&
        candidate.alg === 'RS256',
    );

    if (!match) {
      throw new ForbiddenException('Unable to resolve provider signing key');
    }

    const publicKey = createPublicKey({
      key: match as JsonWebKey,
      format: 'jwk',
    });

    const valid = verify(
      'RSA-SHA256',
      Buffer.from(signatureInput, 'utf8'),
      publicKey,
      signature,
    );

    if (!valid) {
      throw new ForbiddenException('Invalid provider signature');
    }
  }

  private async fetchJwks(config: AuthProviderConfig) {
    const url = config.jwksUrl ?? this.defaultJwksUrlFor(config.provider);
    const cached = this.jwksCache.get(url);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.keys;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new ForbiddenException(`Unable to fetch JWKS for ${config.provider}`);
    }

    const payload = (await response.json()) as { keys?: Array<Record<string, unknown>> };
    const keys = payload.keys ?? [];
    this.jwksCache.set(url, {
      keys,
      expiresAt: Date.now() + 60 * 60 * 1000,
    });

    return keys;
  }
}
