import { Controller, Get, Query } from '@nestjs/common';
import { RewardsService } from './rewards.service';

@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get()
  list(@Query('childId') childId?: string) {
    return this.rewardsService.list(childId);
  }
}
