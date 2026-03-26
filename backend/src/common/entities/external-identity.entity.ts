import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'external_identities' })
export class ExternalIdentity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  appUserId: string;

  @Column()
  provider: string;

  @Column()
  providerSubject: string;

  @Column({ type: 'text', nullable: true })
  providerConfigId?: string | null;

  @Column({ type: 'text', nullable: true })
  email?: string | null;

  @Column({ type: 'text', nullable: true })
  displayName?: string | null;

  @Column({ type: 'text', nullable: true })
  avatarUrl?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  emailVerifiedAt?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date | null;

  @Column({ type: 'simple-json', nullable: true })
  profileSnapshot?: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
