import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProgressEntry } from './progress-entry.entity';

@Entity({ name: 'activities' })
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ type: 'int' })
  points: number;

  @Column()
  scene3d: string;

  @Column()
  icon2d: string;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => ProgressEntry, (progress) => progress.activity)
  progressEntries: ProgressEntry[];
}
