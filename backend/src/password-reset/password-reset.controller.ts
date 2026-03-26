import { Body, Controller, Post } from '@nestjs/common';
import { PasswordResetConfirmDto } from './dto/password-reset-confirm.dto';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { PasswordResetService } from './password-reset.service';

@Controller('password-reset')
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  @Post('request')
  request(@Body() dto: PasswordResetRequestDto) {
    return this.passwordResetService.requestReset(dto);
  }

  @Post('confirm')
  confirm(@Body() dto: PasswordResetConfirmDto) {
    return this.passwordResetService.confirmReset(dto);
  }
}

