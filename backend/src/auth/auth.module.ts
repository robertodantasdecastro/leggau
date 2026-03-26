import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppUser } from '../common/entities/app-user.entity';
import { AuditEvent } from '../common/entities/audit-event.entity';
import { DeviceSession } from '../common/entities/device-session.entity';
import { ParentProfile } from '../common/entities/parent-profile.entity';
import { PasswordResetToken } from '../common/entities/password-reset-token.entity';
import { TherapistProfile } from '../common/entities/therapist-profile.entity';
import { SessionStoreService } from '../common/session-store.service';
import { AppTokenGuard } from './app-token.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AppUser,
      ParentProfile,
      TherapistProfile,
      DeviceSession,
      PasswordResetToken,
      AuditEvent,
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, SessionStoreService, AppTokenGuard],
  exports: [AuthService, SessionStoreService, AppTokenGuard],
})
export class AuthModule {}
