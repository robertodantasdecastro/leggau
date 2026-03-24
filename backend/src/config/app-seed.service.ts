import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from '../common/entities/activity.entity';
import { ChildProfile } from '../common/entities/child-profile.entity';
import { ParentProfile } from '../common/entities/parent-profile.entity';
import { Reward } from '../common/entities/reward.entity';

@Injectable()
export class AppSeedService implements OnModuleInit {
  private readonly logger = new Logger(AppSeedService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(ParentProfile)
    private readonly parentRepository: Repository<ParentProfile>,
    @InjectRepository(ChildProfile)
    private readonly childRepository: Repository<ChildProfile>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(Reward)
    private readonly rewardRepository: Repository<Reward>,
  ) {}

  async onModuleInit() {
    await this.seedParentsAndChildren();
    await this.seedActivities();
    await this.seedRewards();
  }

  private async seedParentsAndChildren() {
    if ((await this.parentRepository.count()) > 0) {
      return;
    }

    const savedParent = await this.parentRepository.save(
      this.parentRepository.create({
        name:
          this.configService.get<string>('DEFAULT_PARENT_NAME') ??
          'Responsavel Demo',
        email:
          this.configService.get<string>('DEFAULT_PARENT_EMAIL') ??
          'parent@leggau.local',
        role: 'guardian',
      }),
    );

    await this.childRepository.save(
      this.childRepository.create({
        parentId: savedParent.id,
        name: 'Gau',
        age: 6,
        avatar: 'mascot-thumb-blue',
      }),
    );

    this.logger.log('Seeded default family data.');
  }

  private async seedActivities() {
    if ((await this.activityRepository.count()) > 0) {
      return;
    }

    await this.activityRepository.save(
      ['brush-teeth', 'make-bed', 'healthy-snack'].map((code, index) =>
        this.activityRepository.create({
          code,
          title: [
            'Escovar os dentes',
            'Arrumar a cama',
            'Lanche saudavel',
          ][index],
          description: [
            'Complete a rotina de higiene com o mascote Gau.',
            'Organize o quarto e desbloqueie novas estrelas.',
            'Monte um prato colorido e ganhe pontos de energia.',
          ][index],
          points: [15, 20, 10][index],
          scene3d: ['BathroomAdventure', 'BedroomQuest', 'KitchenSprint'][index],
          icon2d: ['toothbrush', 'bed', 'apple'][index],
        }),
      ),
    );

    this.logger.log('Seeded starter activities.');
  }

  private async seedRewards() {
    if ((await this.rewardRepository.count()) > 0) {
      return;
    }

    await this.rewardRepository.save(
      [
        {
          title: 'Sticker do Gau',
          description: 'Desbloqueie um sticker brilhante do mascote.',
          cost: 30,
          imageUrl: '/uploads/rewards/gau-sticker.png',
        },
        {
          title: 'Capacete Espacial',
          description: 'Item cosmetico para as aventuras 3D.',
          cost: 60,
          imageUrl: '/uploads/rewards/space-helmet.png',
        },
      ].map((reward) => this.rewardRepository.create(reward)),
    );

    this.logger.log('Seeded starter rewards.');
  }
}
