import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'media_verification_jobs' })
export class MediaVerificationJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  requestedByUserId: string;

  @Column()
  actorRole: string;

  @Column()
  verificationType: string;

  @Column()
  subjectRole: string;

  @Column({ type: 'text', nullable: true })
  subjectProfileId?: string | null;

  @Column({ default: 'completed' })
  status: string;

  @Column({ type: 'text', nullable: true })
  sampleKey?: string | null;

  @Column({ type: 'simple-json', nullable: true })
  inputAssets?: Array<Record<string, unknown>> | null;

  @Column({ type: 'simple-json', nullable: true })
  extractedData?: Record<string, unknown> | null;

  @Column({ type: 'float', nullable: true })
  confidenceScore?: number | null;

  @Column({ type: 'boolean', nullable: true })
  matched?: boolean | null;

  @Column({ default: false })
  reviewRequired: boolean;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
