import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'billing_providers' })
export class BillingProvider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  displayName: string;

  @Column({ default: 'sandbox' })
  mode: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  apiBaseUrl?: string | null;

  @Column({ type: 'text', nullable: true })
  dashboardUrl?: string | null;

  @Column({ type: 'simple-json', nullable: true })
  settings?: Record<string, string | number | boolean> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
