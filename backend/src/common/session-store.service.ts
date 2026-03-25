import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

type SessionScope = 'app' | 'admin';

type SessionRecord = {
  token: string;
  scope: SessionScope;
  subjectId: string;
  email: string;
  expiresAt: number;
};

type ResetTokenRecord = {
  token: string;
  userId: string;
  email: string;
  expiresAt: number;
};

@Injectable()
export class SessionStoreService {
  private readonly sessions = new Map<string, SessionRecord>();
  private readonly resetTokens = new Map<string, ResetTokenRecord>();

  createSession(scope: SessionScope, subjectId: string, email: string, ttlSeconds = 3600) {
    this.purgeExpired();
    const token = `${scope}-${randomUUID()}`;
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.sessions.set(token, {
      token,
      scope,
      subjectId,
      email,
      expiresAt,
    });

    return {
      accessToken: token,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  getSession(token?: string | null) {
    this.purgeExpired();
    if (!token) {
      return null;
    }

    const record = this.sessions.get(token);
    return record ?? null;
  }

  revokeSession(token?: string | null) {
    if (!token) {
      return false;
    }

    return this.sessions.delete(token);
  }

  countActive(scope?: SessionScope) {
    this.purgeExpired();
    const records = Array.from(this.sessions.values());
    if (!scope) {
      return records.length;
    }

    return records.filter((record) => record.scope === scope).length;
  }

  issueResetToken(userId: string, email: string, ttlSeconds = 1800) {
    this.purgeExpired();
    const token = `reset-${randomUUID()}`;
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.resetTokens.set(token, {
      token,
      userId,
      email,
      expiresAt,
    });

    return {
      token,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  consumeResetToken(token: string) {
    this.purgeExpired();
    const record = this.resetTokens.get(token);
    if (!record) {
      return null;
    }

    this.resetTokens.delete(token);
    return record;
  }

  private purgeExpired() {
    const now = Date.now();

    for (const [key, record] of this.sessions.entries()) {
      if (record.expiresAt <= now) {
        this.sessions.delete(key);
      }
    }

    for (const [key, record] of this.resetTokens.entries()) {
      if (record.expiresAt <= now) {
        this.resetTokens.delete(key);
      }
    }
  }
}
