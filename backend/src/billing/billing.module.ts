import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingPlan } from '../common/entities/billing-plan.entity';
import { BillingProvider } from '../common/entities/billing-provider.entity';
import { BillingTransaction } from '../common/entities/billing-transaction.entity';
import { BillingService } from './billing.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BillingProvider,
      BillingPlan,
      BillingTransaction,
    ]),
  ],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
