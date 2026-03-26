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

  @Column()
  inviteType: string;

  @Column()
  targetEmail: string;

  @Column({ type: 'text', nullable: true })
  minorProfileId?: string | null;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

