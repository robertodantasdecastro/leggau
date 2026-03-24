import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'rewards' })
export class Reward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ type: 'int' })
  cost: number;

  @Column()
  imageUrl: string;
}
