import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'invites' })
export class Invite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  creatorUserId?: string | null;

  @Column({ type: 'text', nullable: true })
  creatorActorRole?: string | null;

  @Column()
  inviteType: string;

  @Column()
  targetEmail: string;

  @Column({ type: 'text', nullable: true })
  targetActorRole?: string | null;

  @Column({ type: 'text', nullable: true })
  minorProfileId?: string | null;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'text', nullable: true })
  acceptedByUserId?: string | null;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, string | number | boolean | null> | null;

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
