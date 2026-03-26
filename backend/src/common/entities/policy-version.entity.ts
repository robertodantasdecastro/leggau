import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'policy_versions' })
export class PolicyVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  policyKey: string;

  @Column()
  version: string;

  @Column()
  title: string;

  @Column()
  audience: string;

  @Column({ type: 'text' })
  contentMarkdown: string;

  @Column({ default: 'published' })
  status: string;

  @Column({ type: 'text', nullable: true })
  sourceDocumentId?: string | null;

  @Column({ type: 'text', nullable: true })
  supersededBy?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

