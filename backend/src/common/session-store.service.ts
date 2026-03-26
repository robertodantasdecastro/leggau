import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { DeviceSession } from './entities/device-session.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { SessionScope } from './platform.constants';

type SessionRecord = {
  token: string;
  scope: SessionScope;
  subjectId: string;
  email: string;
  actorRole: string;
  expiresAt: number;
  refreshToken?: string | null;
  sessionId?: string;
  deviceId?: string | null;
  deviceType?: string | null;
};

type ResetTokenRecord = {
  token: string;
  userId: string;
  email: string;
  expiresAt: number;
};

@Injectable()
export class SessionStoreService {
  constructor(
    @InjectRepository(DeviceSession)
    private readonly deviceSessionRepository: Repository<DeviceSession>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
  ) {}

  async createSession(
    scope: SessionScope,
    subjectId: string,
    email: string,
    actorRole: string,
    ttlSeconds = 3600,
    refreshTtlSeconds = 86400,
    deviceId?: string | null,
    deviceType?: string | null,
  ) {
    await this.purgeExpired();

    const accessToken = `${scope}-${randomUUID()}`;
    const refreshToken = `refresh-${scope}-${randomUUID()}`;
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const refreshExpiresAt = new Date(Date.now() + refreshTtlSeconds * 1000);

    const session = await this.deviceSessionRepository.save(
      this.deviceSessionRepository.create({
        accessToken,
        refreshToken,
        scope,
        subjectId,
        email,
        actorRole,
        deviceId: deviceId ?? null,
        deviceType: deviceType ?? null,
        expiresAt,
        refreshExpiresAt,
        lastSeenAt: new Date(),
      }),
    );

    return {
      accessToken,
      refreshToken,
      expiresAt: expiresAt.toISOString(),
      refreshExpiresAt: refreshExpiresAt.toISOString(),
      session: this.serializeSession(session),
    };
  }

  async getSession(token?: string | null, scope?: SessionScope) {
    await this.purgeExpired();
    if (!token) {
      return null;
    }

    const record = await this.deviceSessionRepository.findOne({
      where: {
        accessToken: token,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
        ...(scope ? { scope } : {}),
      },
      order: { createdAt: 'DESC' },
    });

    if (!record) {
      return null;
    }

    record.lastSeenAt = new Date();
    await this.deviceSessionRepository.save(record);

    return this.toSessionRecord(record);
  }

  async getSessionByRefreshToken(token?: string | null, scope?: SessionScope) {
    await this.purgeExpired();
    if (!token) {
      return null;
    }

    const record = await this.deviceSessionRepository.findOne({
      where: {
        refreshToken: token,
        revokedAt: IsNull(),
        refreshExpiresAt: MoreThan(new Date()),
        ...(scope ? { scope } : {}),
      },
      order: { createdAt: 'DESC' },
    });

    if (!record) {
      return null;
    }

    record.lastSeenAt = new Date();
    await this.deviceSessionRepository.save(record);

    return this.toSessionRecord(record);
  }

  async revokeSession(token?: string | null) {
    if (!token) {
      return false;
    }

    const record = await this.deviceSessionRepository.findOne({
      where: [
        { accessToken: token, revokedAt: IsNull() },
        { refreshToken: token, revokedAt: IsNull() },
      ],
      order: { createdAt: 'DESC' },
    });

    if (!record) {
      return false;
    }

    record.revokedAt = new Date();
    record.sessionStatus = 'revoked';
    await this.deviceSessionRepository.save(record);
    return true;
  }

  async revokeSessionById(id: string) {
    const record = await this.deviceSessionRepository.findOne({
      where: { id, revokedAt: IsNull() },
    });

    if (!record) {
      return false;
    }

    record.revokedAt = new Date();
    record.sessionStatus = 'revoked';
    await this.deviceSessionRepository.save(record);
    return true;
  }

  async listSessions(scope?: SessionScope, subjectId?: string) {
    await this.purgeExpired();

    return this.deviceSessionRepository.find({
      where: {
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
        ...(scope ? { scope } : {}),
        ...(subjectId ? { subjectId } : {}),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async countActive(scope?: SessionScope) {
    await this.purgeExpired();
    return this.deviceSessionRepository.count({
      where: {
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
        ...(scope ? { scope } : {}),
      },
    });
  }

  async issueResetToken(userId: string, email: string, ttlSeconds = 1800) {
    await this.purgeExpired();

    const token = `reset-${randomUUID()}`;
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    const record = await this.passwordResetTokenRepository.save(
      this.passwordResetTokenRepository.create({
        token,
        userId,
        email,
        expiresAt,
      }),
    );

    return {
      token: record.token,
      expiresAt: record.expiresAt.toISOString(),
    };
  }

  async consumeResetToken(token: string): Promise<ResetTokenRecord | null> {
    await this.purgeExpired();

    const record = await this.passwordResetTokenRepository.findOne({
      where: {
        token,
        consumedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });

    if (!record) {
      return null;
    }

    record.consumedAt = new Date();
    await this.passwordResetTokenRepository.save(record);

    return {
      token: record.token,
      userId: record.userId,
      email: record.email,
      expiresAt: record.expiresAt.getTime(),
    };
  }

  private async purgeExpired() {
    const now = new Date();

    await this.deviceSessionRepository
      .createQueryBuilder()
      .update(DeviceSession)
      .set({
        revokedAt: now,
        sessionStatus: 'expired',
      })
      .where('"revokedAt" IS NULL')
      .andWhere('"expiresAt" <= :now', { now })
      .execute();

    await this.passwordResetTokenRepository
      .createQueryBuilder()
      .delete()
      .from(PasswordResetToken)
      .where('"expiresAt" <= :now', { now })
      .orWhere('"consumedAt" IS NOT NULL')
      .execute();
  }

  private serializeSession(session: DeviceSession) {
    return {
      id: session.id,
      scope: session.scope,
      actorRole: session.actorRole,
      email: session.email,
      subjectId: session.subjectId,
      deviceId: session.deviceId,
      deviceType: session.deviceType,
      expiresAt: session.expiresAt?.toISOString?.() ?? session.expiresAt,
      refreshExpiresAt:
        session.refreshExpiresAt?.toISOString?.() ?? session.refreshExpiresAt,
      lastSeenAt: session.lastSeenAt?.toISOString?.() ?? session.lastSeenAt,
    };
  }

  private toSessionRecord(record: DeviceSession): SessionRecord {
    return {
      token: record.accessToken,
      scope: record.scope as SessionScope,
      subjectId: record.subjectId,
      email: record.email,
      actorRole: record.actorRole,
      expiresAt: record.expiresAt.getTime(),
      refreshToken: record.refreshToken,
      sessionId: record.id,
      deviceId: record.deviceId,
      deviceType: record.deviceType,
    };
  }
}
