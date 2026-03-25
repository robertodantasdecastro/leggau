import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'billing_transactions' })
export class BillingTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  providerCode: string;

  @Column({ type: 'text', nullable: true })
  planCode?: string | null;

  @Column({ default: 'inbound' })
  direction: string;

  @Column({ default: 'sandbox_pending' })
  status: string;

  @Column({ type: 'int' })
  amountCents: number;

  @Column({ default: 'BRL' })
  currency: string;

  @Column({ type: 'text', nullable: true })
  externalReference?: string | null;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, string | number | boolean> | null;

  @Column({ type: 'datetime' })
  occurredAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
