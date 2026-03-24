import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ActivitiesModule } from './activities/activities.module';
import { AssetsCatalogModule } from './assets-catalog/assets-catalog.module';
import { AuthModule } from './auth/auth.module';
import { Activity } from './common/entities/activity.entity';
import { ChildProfile } from './common/entities/child-profile.entity';
import { ParentProfile } from './common/entities/parent-profile.entity';
import { ProgressEntry } from './common/entities/progress-entry.entity';
import { Reward } from './common/entities/reward.entity';
import { AppSeedService } from './config/app-seed.service';
import { FamiliesModule } from './families/families.module';
import { HealthModule } from './health/health.module';
import { ProfilesModule } from './profiles/profiles.module';
import { ProgressModule } from './progress/progress.module';
import { RedisModule } from './redis/redis.module';
import { RewardsModule } from './rewards/rewards.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('DB_HOST');
        const port = Number(configService.get<string>('DB_PORT') ?? '5432');
        const synchronize =
          configService.get<string>('DATABASE_SYNC') !== 'false';

        if (host) {
          return {
            type: 'postgres' as const,
            host,
            port,
            username: configService.get<string>('DB_USER'),
            password: configService.get<string>('DB_PASSWORD'),
            database: configService.get<string>('DB_NAME'),
            autoLoadEntities: true,
            synchronize,
          };
        }

        return {
          type: 'sqljs' as const,
          autoLoadEntities: true,
          synchronize: true,
          autoSave: false,
          location: 'leggau-dev',
        };
      },
    }),
    TypeOrmModule.forFeature([
      ParentProfile,
      ChildProfile,
      Activity,
      Reward,
      ProgressEntry,
    ]),
    RedisModule,
    HealthModule,
    AuthModule,
    ProfilesModule,
    FamiliesModule,
    ActivitiesModule,
    RewardsModule,
    ProgressModule,
    AssetsCatalogModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppSeedService],
})
export class AppModule {}
