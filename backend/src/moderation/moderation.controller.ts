import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AdminTokenGuard } from '../admin/admin-token.guard';
import { UpdateModerationCaseDto } from './dto/update-moderation-case.dto';
import { ModerationService } from './moderation.service';

@UseGuards(AdminTokenGuard)
@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get('cases')
  listCases() {
    return this.moderationService.listCases();
  }

  @Patch('cases/:id')
  updateCase(@Param('id') id: string, @Body() dto: UpdateModerationCaseDto) {
    return this.moderationService.updateCase(id, dto);
  }
}

