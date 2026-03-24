import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { ProgressService } from './progress.service';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('summary')
  summary(@Query('childId') childId: string) {
    return this.progressService.getSummary(childId);
  }

  @Post('checkins')
  create(@Body() dto: CreateCheckinDto) {
    return this.progressService.createCheckin(dto);
  }
}
