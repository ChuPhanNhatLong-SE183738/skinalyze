import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { Dermatologist } from '../../dermatologists/entities/dermatologist.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

export enum AppointmentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  appointmentId: string;

  @Column({ type: 'uuid' })
  customerId: string;

  @Column({ type: 'uuid', nullable: true })
  dermatologistId: string;

  @Column({ type: 'uuid', nullable: true })
  transactionId: string;

  @Column({ type: 'datetime' })
  startTime: Date;

  @Column({ type: 'datetime' })
  endTime: Date;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value?: number) => value ?? 0,
      from: (value: string | null) => (value ? Number(value) : 0),
    },
  })
  price: number;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'text', nullable: true })
  meetingUrl: string;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  appointmentStatus: AppointmentStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @ManyToOne(() => Dermatologist, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'dermatologistId' })
  dermatologist: Dermatologist;

  @ManyToOne(() => Transaction, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'transactionId' })
  transaction: Transaction;
}
