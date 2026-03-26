import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AdminTokenGuard } from '../admin/admin-token.guard';
import { AppTokenGuard } from '../auth/app-token.guard';
import { CareTeamService } from './care-team.service';
import { CreateCareTeamMembershipDto } from './dto/create-care-team-membership.dto';
import { UpdateCareTeamMembershipDto } from './dto/update-care-team-membership.dto';

@Controller('care-team')
export class CareTeamController {
  constructor(private readonly careTeamService: CareTeamService) {}

  @UseGuards(AppTokenGuard)
  @Post()
  create(
    @Body() dto: CreateCareTeamMembershipDto,
    @Req() request: { appSession: { subjectId: string; actorRole: string } },
  ) {
    return this.careTeamService.create(dto, request.appSession);
  }

  @UseGuards(AppTokenGuard)
  @Get()
  list(@Query('minorProfileId') minorProfileId?: string) {
    return this.careTeamService.list(minorProfileId);
  }

  @UseGuards(AppTokenGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCareTeamMembershipDto,
    @Req() request: { appSession: { subjectId: string; actorRole: string } },
  ) {
    return this.careTeamService.update(id, dto, request.appSession, {
      allowAdminApproval: false,
    });
  }

  @UseGuards(AdminTokenGuard)
  @Patch(':id/admin')
  updateByAdmin(
    @Param('id') id: string,
    @Body() dto: UpdateCareTeamMembershipDto,
    @Req() request: { adminSession: { subjectId: string; actorRole: string } },
  ) {
    return this.careTeamService.update(id, dto, request.adminSession, {
      allowAdminApproval: true,
    });
  }
}
