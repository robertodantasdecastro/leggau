import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      service: 'leggau-api',
      status: 'ok',
      version: '0.1.0',
      docs: {
        health: '/api/health',
        auth: '/api/auth/dev-login',
        profiles: '/api/profiles/me',
        activities: '/api/activities',
        progress: '/api/progress/checkins',
        rewards: '/api/rewards',
        assetsCatalog: '/api/assets-catalog',
      },
    };
  }
}
