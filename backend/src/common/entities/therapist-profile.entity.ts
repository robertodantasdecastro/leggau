import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'therapist_profiles' })
export class TherapistProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  appUserId: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ default: 'therapist' })
  role: string;

  @Column({ default: 'pending' })
  adminApprovalStatus: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

