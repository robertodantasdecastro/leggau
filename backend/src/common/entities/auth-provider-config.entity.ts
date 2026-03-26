import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'auth_provider_configs' })
export class AuthProviderConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  provider: string;

  @Column()
  displayName: string;

  @Column({ default: false })
  enabled: boolean;

  @Column({ default: 'mock' })
  verificationMode: string;

  @Column({ type: 'text', nullable: true })
  clientId?: string | null;

  @Column({ type: 'text', nullable: true })
  clientSecretEncrypted?: string | null;

  @Column({ type: 'text', nullable: true })
  privateKeyEncrypted?: string | null;

  @Column({ type: 'text', nullable: true })
  issuer?: string | null;

  @Column({ type: 'text', nullable: true })
  jwksUrl?: string | null;

  @Column({ type: 'simple-json', nullable: true })
  allowedAudiences?: string[] | null;

  @Column({ type: 'simple-json', nullable: true })
  scopes?: string[] | null;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
