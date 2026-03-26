import { Body, Controller, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AppTokenGuard } from '../auth/app-token.guard';
import { CreateParentApprovalDto } from './dto/create-parent-approval.dto';
import { UpdateParentApprovalDto } from './dto/update-parent-approval.dto';
import { ParentApprovalsService } from './parent-approvals.service';

@UseGuards(AppTokenGuard)
@Controller('parent-approvals')
export class ParentApprovalsController {
  constructor(private readonly parentApprovalsService: ParentApprovalsService) {}

  @Post()
  create(
    @Body() dto: CreateParentApprovalDto,
    @Req() request: { appSession: { subjectId: string; actorRole: string } },
  ) {
    return this.parentApprovalsService.create(dto, request.appSession);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateParentApprovalDto,
    @Req() request: { appSession: { subjectId: string; actorRole: string } },
  ) {
    return this.parentApprovalsService.update(id, dto, request.appSession);
  }
}

