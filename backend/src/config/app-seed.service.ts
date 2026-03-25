import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from '../common/entities/activity.entity';
import { AdminUser } from '../common/entities/admin-user.entity';
import { AppUser } from '../common/entities/app-user.entity';
import { BillingPlan } from '../common/entities/billing-plan.entity';
import { BillingProvider } from '../common/entities/billing-provider.entity';
import { BillingTransaction } from '../common/entities/billing-transaction.entity';
import { ChildProfile } from '../common/entities/child-profile.entity';
import { LegalDocument } from '../common/entities/legal-document.entity';
import { ParentProfile } from '../common/entities/parent-profile.entity';
import { Reward } from '../common/entities/reward.entity';
import { randomBytes, scryptSync } from 'crypto';

@Injectable()
export class AppSeedService implements OnModuleInit {
  private readonly logger = new Logger(AppSeedService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(AppUser)
    private readonly appUserRepository: Repository<AppUser>,
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
    @InjectRepository(ParentProfile)
    private readonly parentRepository: Repository<ParentProfile>,
    @InjectRepository(ChildProfile)
    private readonly childRepository: Repository<ChildProfile>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(Reward)
    private readonly rewardRepository: Repository<Reward>,
    @InjectRepository(LegalDocument)
    private readonly legalDocumentRepository: Repository<LegalDocument>,
    @InjectRepository(BillingProvider)
    private readonly billingProviderRepository: Repository<BillingProvider>,
    @InjectRepository(BillingPlan)
    private readonly billingPlanRepository: Repository<BillingPlan>,
    @InjectRepository(BillingTransaction)
    private readonly billingTransactionRepository: Repository<BillingTransaction>,
  ) {}

  async onModuleInit() {
    await this.seedParentsAndChildren();
    await this.seedAdmins();
    await this.seedActivities();
    await this.seedRewards();
    await this.seedLegalDocuments();
    await this.seedBilling();
  }

  private async seedParentsAndChildren() {
    if ((await this.parentRepository.count()) > 0) {
      return;
    }

    const defaultEmail =
      this.configService.get<string>('DEFAULT_PARENT_EMAIL') ??
      'parent@leggau.local';

    const { passwordHash, passwordSalt } = this.hashPassword('Parent123!');
    await this.appUserRepository.save(
      this.appUserRepository.create({
        email: defaultEmail,
        displayName:
          this.configService.get<string>('DEFAULT_PARENT_NAME') ??
          'Responsavel Demo',
        passwordHash,
        passwordSalt,
        role: 'parent',
      }),
    );

    const savedParent = await this.parentRepository.save(
      this.parentRepository.create({
        name:
          this.configService.get<string>('DEFAULT_PARENT_NAME') ??
          'Responsavel Demo',
        email: defaultEmail,
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

  private async seedAdmins() {
    if ((await this.adminUserRepository.count()) > 0) {
      return;
    }

    const defaultAdminEmail =
      this.configService.get<string>('DEFAULT_ADMIN_EMAIL') ??
      'admin@leggau.local';
    const defaultAdminPassword =
      this.configService.get<string>('DEFAULT_ADMIN_PASSWORD') ??
      'Admin123!';
    const { passwordHash, passwordSalt } = this.hashPassword(defaultAdminPassword);

    await this.adminUserRepository.save(
      this.adminUserRepository.create({
        email: defaultAdminEmail,
        displayName: 'Leggau Admin',
        role: 'super_admin',
        passwordHash,
        passwordSalt,
      }),
    );

    this.logger.log('Seeded admin user.');
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

  private async seedLegalDocuments() {
    if ((await this.legalDocumentRepository.count()) > 0) {
      return;
    }

    await this.legalDocumentRepository.save(
      [
        {
          key: 'privacy-policy',
          version: '2026.03',
          title: 'Politica de Privacidade',
          audience: 'parent',
          contentMarkdown:
            'Politica base do beta fechado do Leggau, com foco em protecao de dados de responsaveis e criancas.',
          effectiveAt: new Date(),
        },
        {
          key: 'terms-of-use',
          version: '2026.03',
          title: 'Termos de Uso',
          audience: 'parent',
          contentMarkdown:
            'Termos base de uso do Leggau para beta fechado e operacao controlada.',
          effectiveAt: new Date(),
        },
      ].map((document) => this.legalDocumentRepository.create(document)),
    );

    this.logger.log('Seeded legal documents.');
  }

  private async seedBilling() {
    if ((await this.billingProviderRepository.count()) === 0) {
      await this.billingProviderRepository.save(
        [
          {
            code: 'stripe-sandbox',
            displayName: 'Stripe Sandbox',
            mode: 'sandbox',
            apiBaseUrl: 'https://api.stripe.com',
            dashboardUrl: 'https://dashboard.stripe.com/test',
            settings: {
              currency: 'BRL',
              enabled: true,
            },
          },
          {
            code: 'asaas-sandbox',
            displayName: 'Asaas Sandbox',
            mode: 'sandbox',
            apiBaseUrl: 'https://sandbox.asaas.com/api/v3',
            dashboardUrl: 'https://sandbox.asaas.com',
            settings: {
              currency: 'BRL',
              enabled: true,
            },
          },
        ].map((provider) => this.billingProviderRepository.create(provider)),
      );
    }

    if ((await this.billingPlanRepository.count()) === 0) {
      await this.billingPlanRepository.save(
        [
          {
            code: 'family-beta-monthly',
            displayName: 'Plano Familia Beta',
            amountCents: 2990,
            currency: 'BRL',
            interval: 'monthly',
            description: 'Plano beta controlado para familias.',
          },
          {
            code: 'professional-beta-monthly',
            displayName: 'Plano Profissional Beta',
            amountCents: 5990,
            currency: 'BRL',
            interval: 'monthly',
            description: 'Plano sandbox para profissionais de apoio e saude.',
          },
        ].map((plan) => this.billingPlanRepository.create(plan)),
      );
    }

    if ((await this.billingTransactionRepository.count()) === 0) {
      await this.billingTransactionRepository.save(
        [
          {
            providerCode: 'stripe-sandbox',
            planCode: 'family-beta-monthly',
            direction: 'inbound',
            status: 'sandbox_paid',
            amountCents: 2990,
            currency: 'BRL',
            externalReference: 'sandbox-charge-001',
            occurredAt: new Date(),
            metadata: { channel: 'portal', kind: 'subscription' },
          },
          {
            providerCode: 'asaas-sandbox',
            planCode: 'professional-beta-monthly',
            direction: 'inbound',
            status: 'sandbox_pending',
            amountCents: 5990,
            currency: 'BRL',
            externalReference: 'sandbox-charge-002',
            occurredAt: new Date(),
            metadata: { channel: 'admin', kind: 'invoice' },
          },
        ].map((transaction) =>
          this.billingTransactionRepository.create(transaction),
        ),
      );
    }

    this.logger.log('Seeded billing sandbox data.');
  }

  private hashPassword(password: string) {
    const passwordSalt = randomBytes(16).toString('hex');
    const passwordHash = scryptSync(password, passwordSalt, 64).toString('hex');
    return { passwordHash, passwordSalt };
  }
}
