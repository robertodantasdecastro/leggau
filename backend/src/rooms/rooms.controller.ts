import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AppTokenGuard } from '../auth/app-token.guard';
import { PresenceHeartbeatDto } from './dto/presence-heartbeat.dto';
import { RoomActionDto } from './dto/room-action.dto';
import { RoomsService } from './rooms.service';

@UseGuards(AppTokenGuard)
@Controller()
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get('rooms')
  list(
    @Query('minorProfileId') minorProfileId: string,
    @Req() request: { appSession: { subjectId: string; actorRole: string; email: string } },
  ) {
    return this.roomsService.list(minorProfileId, request.appSession);
  }

  @Post('rooms/:roomId/join')
  join(
    @Param('roomId') roomId: string,
    @Body() dto: RoomActionDto,
    @Req() request: { appSession: { subjectId: string; actorRole: string; email: string } },
  ) {
    return this.roomsService.join(roomId, dto, request.appSession);
  }

  @Post('rooms/:roomId/leave')
  leave(
    @Param('roomId') roomId: string,
    @Body() dto: RoomActionDto,
    @Req() request: { appSession: { subjectId: string; actorRole: string; email: string } },
  ) {
    return this.roomsService.leave(roomId, dto, request.appSession);
  }

  @Post('presence/heartbeat')
  heartbeat(
    @Body() dto: PresenceHeartbeatDto,
    @Req() request: { appSession: { subjectId: string; actorRole: string; email: string } },
  ) {
    return this.roomsService.heartbeat(dto, request.appSession);
  }

  @Get('presence/:roomId')
  getPresence(
    @Param('roomId') roomId: string,
    @Query('minorProfileId') minorProfileId: string,
    @Req() request: { appSession: { subjectId: string; actorRole: string; email: string } },
  ) {
    return this.roomsService.getPresence(roomId, minorProfileId, request.appSession);
  }
}
