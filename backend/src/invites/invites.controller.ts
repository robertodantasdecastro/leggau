import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AppTokenGuard } from '../auth/app-token.guard';
import { CreateInviteDto } from './dto/create-invite.dto';
import { InvitesService } from './invites.service';

@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @UseGuards(AppTokenGuard)
  @Get()
  list(
    @Req() request: { appSession: { subjectId: string; actorRole: string; email: string } },
    @Query('minorProfileId') minorProfileId?: string,
  ) {
    return this.invitesService.list(request.appSession, minorProfileId);
  }

  @UseGuards(AppTokenGuard)
  @Post()
  create(
    @Body() dto: CreateInviteDto,
    @Req() request: { appSession: { subjectId: string; actorRole: string; email: string } },
  ) {
    return this.invitesService.create(dto, request.appSession);
  }

  @UseGuards(AppTokenGuard)
  @Post(':id/accept')
  accept(
    @Param('id') id: string,
    @Req() request: { appSession: { subjectId: string; actorRole: string; email: string } },
  ) {
    return this.invitesService.accept(id, request.appSession);
  }
}
