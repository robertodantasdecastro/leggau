import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'moderation_cases' })
export class ModerationCase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sourceType: string;

  @Column({ type: 'text', nullable: true })
  sourceId?: string | null;

  @Column({ default: 'open' })
  status: string;

  @Column({ default: 'medium' })
  severity: string;

  @Column({ type: 'text', nullable: true })
  policyCode?: string | null;

  @Column({ type: 'simple-json', nullable: true })
  aiDecision?: Record<string, string | number | boolean | null> | null;

  @Column({ default: true })
  humanReviewRequired: boolean;

  @Column({ type: 'text', nullable: true })
  reviewedBy?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

