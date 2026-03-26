import { Body, Controller, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AppTokenGuard } from '../auth/app-token.guard';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { DevicesService } from './devices.service';

@UseGuards(AppTokenGuard)
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('register')
  register(
    @Body() dto: RegisterDeviceDto,
    @Req() request: { appSession: { sessionId?: string; subjectId: string; actorRole: string } },
  ) {
    return this.devicesService.registerDevice(
      request.appSession.sessionId ?? '',
      request.appSession.subjectId,
      request.appSession.actorRole,
      dto,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDeviceDto,
    @Req() request: { appSession: { subjectId: string; actorRole: string } },
  ) {
    return this.devicesService.updateDevice(
      id,
      request.appSession.subjectId,
      request.appSession.actorRole,
      dto,
    );
  }
}

