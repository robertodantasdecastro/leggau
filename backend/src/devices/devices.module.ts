import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { DeviceSession } from '../common/entities/device-session.entity';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';

@Module({
  imports: [AuthModule, AuditModule, TypeOrmModule.forFeature([DeviceSession])],
  controllers: [DevicesController],
  providers: [DevicesService],
})
export class DevicesModule {}

