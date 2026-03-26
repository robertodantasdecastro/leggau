import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'consent_records' })
export class ConsentRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  appUserId: string;

  @Column()
  appUserEmail: string;

  @Column()
  documentId: string;

  @Column()
  documentKey: string;

  @Column()
  documentVersion: string;

  @Column({ type: 'text', nullable: true })
  policyVersionId?: string | null;

  @Column({ default: 'accepted' })
  status: string;

  @Column({ type: 'timestamp' })
  acceptedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
