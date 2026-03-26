import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminTokenGuard } from '../admin/admin-token.guard';
import { CreatePolicyVersionDto } from './dto/create-policy-version.dto';
import { UpdatePolicyVersionDto } from './dto/update-policy-version.dto';
import { PolicyVersionsService } from './policy-versions.service';

@UseGuards(AdminTokenGuard)
@Controller('policy-versions')
export class PolicyVersionsController {
  constructor(private readonly policyVersionsService: PolicyVersionsService) {}

  @Get()
  list() {
    return this.policyVersionsService.list();
  }

  @Post()
  create(@Body() dto: CreatePolicyVersionDto) {
    return this.policyVersionsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePolicyVersionDto) {
    return this.policyVersionsService.update(id, dto);
  }
}

