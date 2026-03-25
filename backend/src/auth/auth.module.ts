import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppUser } from '../common/entities/app-user.entity';
import { ParentProfile } from '../common/entities/parent-profile.entity';
import { SessionStoreService } from '../common/session-store.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [TypeOrmModule.forFeature([AppUser, ParentProfile])],
  controllers: [AuthController],
  providers: [AuthService, SessionStoreService],
  exports: [AuthService, SessionStoreService],
})
export class AuthModule {}
