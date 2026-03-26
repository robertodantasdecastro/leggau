import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Activity } from './activity.entity';
import { ChildProfile } from './child-profile.entity';

@Entity({ name: 'progress_entries' })
export class ProgressEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  childId: string;

  @Column()
  activityId: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'int' })
  pointsEarned: number;

  @CreateDateColumn()
  performedAt: Date;

  @ManyToOne(() => ChildProfile, (child) => child.progressEntries, {
    onDelete: 'CASCADE',
    createForeignKeyConstraints: false,
  })
  child: ChildProfile;

  @ManyToOne(() => Activity, (activity) => activity.progressEntries, {
    onDelete: 'CASCADE',
  })
  activity: Activity;
}
