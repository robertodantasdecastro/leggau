import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'care_team_memberships' })
export class CareTeamMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  therapistUserId: string;

  @Column({ type: 'text', nullable: true })
  therapistProfileId?: string | null;

  @Column()
  parentUserId: string;

  @Column()
  parentProfileId: string;

  @Column()
  minorProfileId: string;

  @Column()
  minorRole: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ default: 'pending' })
  adminApprovalStatus: string;

  @Column({ default: 'pending' })
  parentApprovalStatus: string;

  @Column({ type: 'simple-json', nullable: true })
  scope?: Record<string, string | number | boolean | null> | null;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

