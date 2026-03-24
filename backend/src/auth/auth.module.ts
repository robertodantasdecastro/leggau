import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParentProfile } from '../common/entities/parent-profile.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [TypeOrmModule.forFeature([ParentProfile])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
