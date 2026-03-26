import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SessionStoreService } from '../common/session-store.service';

@Injectable()
export class AppTokenGuard implements CanActivate {
  constructor(private readonly sessionStoreService: SessionStoreService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization as string | undefined;
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : null;

    const session = await this.sessionStoreService.getSession(token ?? undefined, 'app');
    if (!session) {
      throw new UnauthorizedException('App session required');
    }

    request.appSession = session;
    return true;
  }
}

