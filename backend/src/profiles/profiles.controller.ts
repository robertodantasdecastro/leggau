import { Controller, Get, Query } from '@nestjs/common';
import { ProfilesService } from './profiles.service';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  me(@Query('email') email?: string) {
    return this.profilesService.getProfile(email);
  }
}
