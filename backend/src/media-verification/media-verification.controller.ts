import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AppTokenGuard } from '../auth/app-token.guard';
import { CreateMediaVerificationJobDto } from './dto/create-media-verification-job.dto';
import { MediaVerificationService } from './media-verification.service';

@UseGuards(AppTokenGuard)
@Controller('media-verification')
export class MediaVerificationController {
  constructor(private readonly mediaVerificationService: MediaVerificationService) {}

  @Post()
  create(
    @Body() dto: CreateMediaVerificationJobDto,
    @Req() request: { appSession: { subjectId: string; actorRole: string } },
  ) {
    return this.mediaVerificationService.create(dto, request.appSession);
  }

  @Get()
  list(@Req() request: { appSession: { subjectId: string; actorRole: string } }) {
    return this.mediaVerificationService.listForActor(request.appSession);
  }

  @Get(':id')
  get(
    @Param('id') id: string,
    @Req() request: { appSession: { subjectId: string; actorRole: string } },
  ) {
    return this.mediaVerificationService.getById(id, request.appSession);
  }
}
