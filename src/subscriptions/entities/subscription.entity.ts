import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Dermatologist } from '../../dermatologists/entities/dermatologist.entity';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  subscriptionId: string;

  @Column({ type: 'text' })
  subscriptionDescription: string;

  @Column({ type: 'uuid' })
  dermatologistId: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value?: number) => value ?? 0,
      from: (value: string | null) => (value ? Number(value) : 0),
    },
  })
  basePrice: number;

  @Column({ type: 'int' })
  totalSessions: number;

  @Column({ type: 'int' })
  durationInDays: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Dermatologist, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'dermatologistId' })
  dermatologist: Dermatologist;
}
