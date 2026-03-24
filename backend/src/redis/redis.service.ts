import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client?: Redis;

  constructor(private readonly configService: ConfigService) {}

  async ping(): Promise<'ok' | 'disabled' | 'error'> {
    if (!this.isEnabled()) {
      return 'disabled';
    }

    try {
      const client = this.getClient();
      const response = await client.ping();
      return response === 'PONG' ? 'ok' : 'error';
    } catch (error) {
      this.logger.warn(`Redis ping failed: ${(error as Error).message}`);
      return 'error';
    }
  }

  async cacheJson(key: string, value: unknown, ttlSeconds = 300) {
    if (!this.isEnabled()) {
      return;
    }

    const client = this.getClient();
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async getJson<T>(key: string): Promise<T | null> {
    if (!this.isEnabled()) {
      return null;
    }

    const client = this.getClient();
    const payload = await client.get(key);
    return payload ? (JSON.parse(payload) as T) : null;
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  private isEnabled() {
    return this.configService.get<string>('REDIS_ENABLED') === 'true';
  }

  private getClient() {
    if (!this.client) {
      this.client = new Redis({
        host: this.configService.get<string>('REDIS_HOST') ?? '127.0.0.1',
        port: Number(this.configService.get<string>('REDIS_PORT') ?? '6379'),
        lazyConnect: true,
        maxRetriesPerRequest: 1,
      });
    }

    return this.client;
  }
}
