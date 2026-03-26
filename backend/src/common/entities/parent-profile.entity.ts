import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ChildProfile } from './child-profile.entity';

@Entity({ name: 'parent_profiles' })
export class ParentProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true, nullable: true })
  appUserId?: string | null;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ default: 'parent_guardian' })
  role: string;

  @OneToMany(() => ChildProfile, (child) => child.parent)
  children: ChildProfile[];
}
