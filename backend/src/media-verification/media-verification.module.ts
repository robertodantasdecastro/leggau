import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { MediaVerificationJob } from '../common/entities/media-verification-job.entity';
import { MediaVerificationController } from './media-verification.controller';
import { MediaVerificationService } from './media-verification.service';

@Module({
  imports: [
    AuthModule,
    AuditModule,
    TypeOrmModule.forFeature([MediaVerificationJob]),
  ],
  controllers: [MediaVerificationController],
  providers: [MediaVerificationService],
  exports: [MediaVerificationService],
})
export class MediaVerificationModule {}
