import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { AdminTokenGuard } from './admin-token.guard';
import { AdminLoginDto } from './dto/admin-login.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

@Controller('admin')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('auth/login')
  login(@Body() dto: AdminLoginDto) {
    return this.adminAuthService.login(dto);
  }

  @UseGuards(AdminTokenGuard)
  @Get('admin-users')
  listAdmins() {
    return this.adminAuthService.listAdmins();
  }

  @UseGuards(AdminTokenGuard)
  @Post('admin-users')
  createAdmin(@Body() dto: CreateAdminUserDto) {
    return this.adminAuthService.createAdmin(dto);
  }

  @UseGuards(AdminTokenGuard)
  @Patch('admin-users/:id')
  updateAdmin(@Param('id') id: string, @Body() dto: UpdateAdminUserDto) {
    return this.adminAuthService.updateAdmin(id, dto);
  }
}
