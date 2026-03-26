import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AppTokenGuard } from '../auth/app-token.guard';
import { CreateGuardianLinkDto } from './dto/create-guardian-link.dto';
import { UpdateGuardianLinkDto } from './dto/update-guardian-link.dto';
import { GuardianshipService } from './guardianship.service';

@UseGuards(AppTokenGuard)
@Controller('guardianship')
export class GuardianshipController {
  constructor(private readonly guardianshipService: GuardianshipService) {}

  @Post()
  create(
    @Body() dto: CreateGuardianLinkDto,
    @Req() request: { appSession: { subjectId: string; actorRole: string } },
  ) {
    return this.guardianshipService.create(dto, request.appSession);
  }

  @Get()
  list(@Query('parentUserId') parentUserId?: string, @Query('minorProfileId') minorProfileId?: string) {
    return this.guardianshipService.list(parentUserId, minorProfileId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateGuardianLinkDto,
    @Req() request: { appSession: { subjectId: string; actorRole: string } },
  ) {
    return this.guardianshipService.update(id, dto, request.appSession);
  }
}

