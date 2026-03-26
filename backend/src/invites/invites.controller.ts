import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AppTokenGuard } from '../auth/app-token.guard';
import { CreateInviteDto } from './dto/create-invite.dto';
import { InvitesService } from './invites.service';

@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @UseGuards(AppTokenGuard)
  @Get()
  list() {
    return this.invitesService.list();
  }

  @UseGuards(AppTokenGuard)
  @Post()
  create(
    @Body() dto: CreateInviteDto,
    @Req() request: { appSession: { subjectId: string; actorRole: string } },
  ) {
    return this.invitesService.create(dto, request.appSession);
  }

  @Post(':id/accept')
  accept(@Param('id') id: string) {
    return this.invitesService.accept(id);
  }
}

