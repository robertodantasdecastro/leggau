import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminTokenGuard } from '../admin/admin-token.guard';
import { CreateModerationCaseDto } from './dto/create-moderation-case.dto';
import { UpdateModerationCaseDto } from './dto/update-moderation-case.dto';
import { ModerationService } from './moderation.service';

@UseGuards(AdminTokenGuard)
@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get('cases')
  listCases(
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('sourceType') sourceType?: string,
  ) {
    return this.moderationService.listCases({
      status,
      severity,
      sourceType,
    });
  }

  @Post('cases')
  createCase(@Body() dto: CreateModerationCaseDto) {
    return this.moderationService.createCase(dto);
  }

  @Patch('cases/:id')
  updateCase(@Param('id') id: string, @Body() dto: UpdateModerationCaseDto) {
    return this.moderationService.updateCase(id, dto);
  }
}
