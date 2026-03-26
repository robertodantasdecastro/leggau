import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { AppUser } from '../common/entities/app-user.entity';
import { PasswordResetToken } from '../common/entities/password-reset-token.entity';
import { AuthModule } from '../auth/auth.module';
import { PasswordResetController } from './password-reset.controller';
import { PasswordResetService } from './password-reset.service';

@Module({
  imports: [
    AuthModule,
    AuditModule,
    TypeOrmModule.forFeature([AppUser, PasswordResetToken]),
  ],
  controllers: [PasswordResetController],
  providers: [PasswordResetService],
  exports: [PasswordResetService],
})
export class PasswordResetModule {}

