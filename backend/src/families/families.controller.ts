import { Controller, Get, Query } from '@nestjs/common';
import { FamiliesService } from './families.service';

@Controller('families')
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  @Get('overview')
  overview(@Query('email') email?: string) {
    return this.familiesService.getOverview(email);
  }
}
