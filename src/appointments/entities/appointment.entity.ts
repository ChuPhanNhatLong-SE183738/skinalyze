import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { Dermatologist } from '../../dermatologists/entities/dermatologist.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { TreatmentRoutine } from '../../treatment-routines/entities/treatment-routine.entity';
import { SkinAnalysis } from '../../skin-analysis/entities/skin-analysis.entity'; // Import SkinAnalysis
import { AvailabilitySlot } from 'src/availability-slots/entities/availability-slot.entity';

export enum AppointmentStatus {
  PENDING_PAYMENT = 'pending_payment',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  INTERRUPTED = 'interrupted',
}

export enum AppointmentType {
  NEW_PROBLEM = 'new_problem',
  FOLLOW_UP = 'follow_up',
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  appointmentId: string;

  @Column({ type: 'datetime' })
  startTime: Date;

  @Column({ type: 'datetime' })
  endTime: Date;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  price: number;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  meetingUrl: string;

  @Column({
    type: 'enum',
    enum: AppointmentType,
  })
  appointmentType: AppointmentType;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING_PAYMENT,
  })
  appointmentStatus: AppointmentStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  terminatedReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // RELATIONSHIPS

  @ManyToOne(() => Dermatologist, (dermatologist) => dermatologist.appointments)
  @JoinColumn({ name: 'dermatologistId' })
  dermatologist: Dermatologist;

  @ManyToOne(() => Customer, (customer) => customer.appointments)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @OneToOne(() => Transaction, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'transactionId' })
  transaction: Transaction;

  @OneToOne(() => SkinAnalysis, { nullable: true })
  @JoinColumn({ name: 'analysisId' })
  skinAnalysis: SkinAnalysis;

  @OneToOne(() => TreatmentRoutine, (routine) => routine.createdFromAppointment)
  createdRoutine: TreatmentRoutine;

  // Keep: follow-up relationship remains Many-to-One.
  // "Which routine is this appointment tracking?"
  @ManyToOne(
    () => TreatmentRoutine,
    (routine) => routine.followUpAppointments,
    {
      nullable: true,
    },
  )
  @JoinColumn({ name: 'trackingRoutineId' })
  trackingRoutine: TreatmentRoutine;

  @OneToOne(() => AvailabilitySlot, (slot) => slot.appointment)
  availabilitySlot: AvailabilitySlot;
}
