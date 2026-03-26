import { Controller, Delete, Get, Param, Req, UseGuards } from '@nestjs/common';
import { AppTokenGuard } from '../auth/app-token.guard';
import { SessionsService } from './sessions.service';

@UseGuards(AppTokenGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  list(@Req() request: { appSession: { subjectId: string } }) {
    return this.sessionsService.listSessions(request.appSession.subjectId);
  }

  @Delete(':id')
  revoke(
    @Param('id') id: string,
    @Req() request: { appSession: { subjectId: string; actorRole: string } },
  ) {
    return this.sessionsService.revokeSession(
      id,
      request.appSession.subjectId,
      request.appSession.actorRole,
    );
  }
}

