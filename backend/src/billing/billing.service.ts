import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillingPlan } from '../common/entities/billing-plan.entity';
import { BillingProvider } from '../common/entities/billing-provider.entity';
import { BillingTransaction } from '../common/entities/billing-transaction.entity';
import { UpsertBillingPlanDto } from './dto/upsert-billing-plan.dto';
import { UpsertBillingProviderDto } from './dto/upsert-billing-provider.dto';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(BillingProvider)
    private readonly providerRepository: Repository<BillingProvider>,
    @InjectRepository(BillingPlan)
    private readonly planRepository: Repository<BillingPlan>,
    @InjectRepository(BillingTransaction)
    private readonly transactionRepository: Repository<BillingTransaction>,
  ) {}

  async getOverview() {
    const transactions = await this.transactionRepository.find({
      order: { occurredAt: 'DESC' },
      take: 50,
    });
    const inbound = transactions
      .filter((transaction) => transaction.direction === 'inbound')
      .reduce((sum, transaction) => sum + transaction.amountCents, 0);
    const outbound = transactions
      .filter((transaction) => transaction.direction === 'outbound')
      .reduce((sum, transaction) => sum + transaction.amountCents, 0);

    return {
      providers: await this.providerRepository.count(),
      plans: await this.planRepository.count(),
      transactions: transactions.length,
      totals: {
        inboundCents: inbound,
        outboundCents: outbound,
        netCents: inbound - outbound,
      },
      latestTransactions: transactions,
    };
  }

  listProviders() {
    return this.providerRepository.find({ order: { createdAt: 'ASC' } });
  }

  async createProvider(payload: Record<string, unknown>) {
    const dto = payload as unknown as UpsertBillingProviderDto;
    return this.providerRepository.save(
      this.providerRepository.create({
        code: dto.code,
        displayName: dto.displayName,
        mode: dto.mode ?? 'sandbox',
        isActive: dto.isActive ?? true,
        apiBaseUrl: dto.apiBaseUrl ?? null,
        dashboardUrl: dto.dashboardUrl ?? null,
        settings: dto.settings ?? null,
      }),
    );
  }

  async updateProvider(id: string, payload: Record<string, unknown>) {
    const dto = payload as unknown as Partial<UpsertBillingProviderDto>;
    const provider = await this.providerRepository.findOne({ where: { id } });
    if (!provider) {
      throw new NotFoundException('Billing provider not found');
    }

    provider.displayName = dto.displayName ?? provider.displayName;
    provider.mode = dto.mode ?? provider.mode;
    provider.isActive = dto.isActive ?? provider.isActive;
    provider.apiBaseUrl = dto.apiBaseUrl ?? provider.apiBaseUrl;
    provider.dashboardUrl = dto.dashboardUrl ?? provider.dashboardUrl;
    provider.settings = dto.settings ?? provider.settings;

    return this.providerRepository.save(provider);
  }

  listPlans() {
    return this.planRepository.find({ order: { createdAt: 'ASC' } });
  }

  async createPlan(payload: Record<string, unknown>) {
    const dto = payload as unknown as UpsertBillingPlanDto;
    return this.planRepository.save(
      this.planRepository.create({
        code: dto.code,
        displayName: dto.displayName,
        currency: dto.currency ?? 'BRL',
        amountCents: dto.amountCents,
        interval: dto.interval ?? 'monthly',
        isActive: dto.isActive ?? true,
        description: dto.description ?? null,
      }),
    );
  }

  listTransactions() {
    return this.transactionRepository.find({
      order: { occurredAt: 'DESC' },
    });
  }

  async listWebhookEvents() {
    const transactions = await this.transactionRepository.find({
      order: { occurredAt: 'DESC' },
      take: 20,
    });

    return transactions.map((transaction) => ({
      id: transaction.id,
      providerCode: transaction.providerCode,
      status: transaction.status,
      occurredAt: transaction.occurredAt,
      externalReference: transaction.externalReference,
    }));
  }
}
