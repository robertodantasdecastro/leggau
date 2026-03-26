import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminTokenGuard } from '../admin/admin-token.guard';
import { AuditService } from './audit.service';

@UseGuards(AdminTokenGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('events')
  listEvents(
    @Query('eventType') eventType?: string,
    @Query('actorRole') actorRole?: string,
    @Query('resourceType') resourceType?: string,
  ) {
    return this.auditService.listEvents({
      eventType,
      actorRole,
      resourceType,
    });
  }
}
