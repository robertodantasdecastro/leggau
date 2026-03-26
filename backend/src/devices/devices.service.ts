import { NotFoundException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { DeviceSession } from '../common/entities/device-session.entity';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@Injectable()
export class DevicesService {
  constructor(
    private readonly auditService: AuditService,
    @InjectRepository(DeviceSession)
    private readonly deviceSessionRepository: Repository<DeviceSession>,
  ) {}

  async registerDevice(
    sessionId: string,
    actorUserId: string,
    actorRole: string,
    dto: RegisterDeviceDto,
  ) {
    const session = await this.deviceSessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    session.deviceId = dto.deviceId?.trim() || session.deviceId;
    session.deviceType = dto.deviceType?.trim() || session.deviceType;
    session.lastSeenAt = new Date();
    const saved = await this.deviceSessionRepository.save(session);

    await this.auditService.record('device.registered', {
      actorRole,
      actorUserId,
      resourceType: 'device_session',
      resourceId: saved.id,
      outcome: 'success',
      severity: 'low',
      metadata: {
        deviceId: saved.deviceId ?? null,
        deviceType: saved.deviceType ?? null,
      },
    });

    return saved;
  }

  async updateDevice(
    id: string,
    actorUserId: string,
    actorRole: string,
    dto: UpdateDeviceDto,
  ) {
    const session = await this.deviceSessionRepository.findOne({ where: { id } });
    if (!session) {
      throw new NotFoundException('Device session not found');
    }

    session.deviceType = dto.deviceType?.trim() || session.deviceType;
    session.lastSeenAt = new Date();
    const saved = await this.deviceSessionRepository.save(session);

    await this.auditService.record('device.updated', {
      actorRole,
      actorUserId,
      resourceType: 'device_session',
      resourceId: saved.id,
      outcome: 'success',
      severity: 'low',
    });

    return saved;
  }
}

