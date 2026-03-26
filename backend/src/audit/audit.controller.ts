import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminTokenGuard } from '../admin/admin-token.guard';
import { AuditService } from './audit.service';

@UseGuards(AdminTokenGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('events')
  listEvents() {
    return this.auditService.listEvents();
  }
}

