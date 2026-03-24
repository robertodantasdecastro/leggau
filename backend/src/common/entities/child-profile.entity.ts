import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ParentProfile } from './parent-profile.entity';
import { ProgressEntry } from './progress-entry.entity';

@Entity({ name: 'child_profiles' })
export class ChildProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  parentId: string;

  @Column()
  name: string;

  @Column({ type: 'int' })
  age: number;

  @Column({ default: 'default-avatar' })
  avatar: string;

  @ManyToOne(() => ParentProfile, (parent) => parent.children, {
    onDelete: 'CASCADE',
  })
  parent: ParentProfile;

  @OneToMany(() => ProgressEntry, (progress) => progress.child)
  progressEntries: ProgressEntry[];
}
