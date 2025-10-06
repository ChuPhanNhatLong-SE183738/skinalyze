import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BatchItem } from './batch-item.entity';

@Entity('batches')
export class Batch {
  @PrimaryGeneratedColumn('uuid')
  batchId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string;

  @OneToMany(() => BatchItem, (batchItem) => batchItem.batchRelation)
  batchItems: BatchItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => BatchItem, (item) => item.batch, { cascade: true })
  items: BatchItem[];
}
