import { Body, Controller, Get, Post } from '@nestjs/common';
import { RecordConsentDto } from './dto/record-consent.dto';
import { LegalService } from './legal.service';

@Controller('legal')
export class LegalController {
  constructor(private readonly legalService: LegalService) {}

  @Get('documents')
  getDocuments() {
    return this.legalService.getDocuments();
  }

  @Post('consents')
  recordConsent(@Body() dto: RecordConsentDto) {
    return this.legalService.recordConsent(dto);
  }
}
