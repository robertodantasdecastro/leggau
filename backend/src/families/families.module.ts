import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdolescentProfile } from '../common/entities/adolescent-profile.entity';
import { ChildProfile } from '../common/entities/child-profile.entity';
import { GuardianLink } from '../common/entities/guardian-link.entity';
import { ParentProfile } from '../common/entities/parent-profile.entity';
import { FamiliesController } from './families.controller';
import { FamiliesService } from './families.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ParentProfile,
      ChildProfile,
      AdolescentProfile,
      GuardianLink,
    ]),
  ],
  controllers: [FamiliesController],
  providers: [FamiliesService],
  exports: [FamiliesService],
})
export class FamiliesModule {}
