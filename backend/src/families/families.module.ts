import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChildProfile } from '../common/entities/child-profile.entity';
import { ParentProfile } from '../common/entities/parent-profile.entity';
import { FamiliesController } from './families.controller';
import { FamiliesService } from './families.service';

@Module({
  imports: [TypeOrmModule.forFeature([ParentProfile, ChildProfile])],
  controllers: [FamiliesController],
  providers: [FamiliesService],
})
export class FamiliesModule {}
