import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'device_sessions' })
export class DeviceSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  accessToken: string;

  @Column({ unique: true })
  refreshToken: string;

  @Column()
  scope: string;

  @Column()
  subjectId: string;

  @Column()
  email: string;

  @Column()
  actorRole: string;

  @Column({ type: 'text', nullable: true })
  deviceId?: string | null;

  @Column({ type: 'text', nullable: true })
  deviceType?: string | null;

  @Column({ default: 'active' })
  sessionStatus: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'timestamp' })
  refreshExpiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastSeenAt?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt?: Date | null;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, string | number | boolean | null> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

