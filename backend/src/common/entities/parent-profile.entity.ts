import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ChildProfile } from './child-profile.entity';

@Entity({ name: 'parent_profiles' })
export class ParentProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ default: 'guardian' })
  role: string;

  @OneToMany(() => ChildProfile, (child) => child.parent)
  children: ChildProfile[];
}
