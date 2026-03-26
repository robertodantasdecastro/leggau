import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'audit_events' })
export class AuditEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  eventType: string;

  @Column()
  actorRole: string;

  @Column({ type: 'text', nullable: true })
  actorUserId?: string | null;

  @Column()
  resourceType: string;

  @Column({ type: 'text', nullable: true })
  resourceId?: string | null;

  @Column()
  outcome: string;

  @Column({ default: 'low' })
  severity: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, string | number | boolean | null> | null;

  @CreateDateColumn()
  occurredAt: Date;
}

