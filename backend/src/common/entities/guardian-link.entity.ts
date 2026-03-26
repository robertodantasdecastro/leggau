import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'guardian_links' })
export class GuardianLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  parentUserId: string;

  @Column()
  parentProfileId: string;

  @Column()
  minorProfileId: string;

  @Column()
  minorRole: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  createdBy?: string | null;

  @Column({ type: 'simple-json', nullable: true })
  auditContext?: Record<string, string | number | boolean | null> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

