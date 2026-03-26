import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'incidents' })
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sourceType: string;

  @Column({ type: 'text', nullable: true })
  sourceId?: string | null;

  @Column({ default: 'medium' })
  severity: string;

  @Column({ default: 'open' })
  status: string;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'text', nullable: true })
  createdByUserId?: string | null;

  @Column({ type: 'text', nullable: true })
  createdByRole?: string | null;

  @Column({ type: 'text', nullable: true })
  reviewedBy?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt?: Date | null;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, string | number | boolean | null> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

