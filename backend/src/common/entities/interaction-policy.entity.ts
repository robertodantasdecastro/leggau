import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'interaction_policies' })
export class InteractionPolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  minorProfileId: string;

  @Column()
  minorRole: string;

  @Column()
  ageBand: string;

  @Column({ default: true })
  roomsEnabled: boolean;

  @Column({ default: true })
  presenceEnabled: boolean;

  @Column({ default: 'none' })
  messagingMode: string;

  @Column({ default: false })
  therapistParticipationAllowed: boolean;

  @Column({ type: 'simple-json', nullable: true })
  guardianOverride?: Record<string, string | number | boolean | null> | null;

  @Column({ type: 'timestamp', nullable: true })
  effectiveFrom?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  effectiveTo?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

