import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'parent_approvals' })
export class ParentApproval {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  parentUserId: string;

  @Column()
  approvalType: string;

  @Column()
  targetId: string;

  @Column({ default: 'granted' })
  decision: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, string | number | boolean | null> | null;

  @Column({ type: 'timestamp', nullable: true })
  decidedAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
