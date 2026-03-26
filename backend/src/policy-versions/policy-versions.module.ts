import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from '../admin/admin.module';
import { PolicyVersion } from '../common/entities/policy-version.entity';
import { PolicyVersionsController } from './policy-versions.controller';
import { PolicyVersionsService } from './policy-versions.service';

@Module({
  imports: [AdminModule, TypeOrmModule.forFeature([PolicyVersion])],
  controllers: [PolicyVersionsController],
  providers: [PolicyVersionsService],
  exports: [PolicyVersionsService],
})
export class PolicyVersionsModule {}

