import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { TreatmentRoutine } from '../../treatment-routines/entities/treatment-routine.entity';
import { Appointment } from 'src/appointments/entities/appointment.entity';
import { SubscriptionPlan } from '../../subscription-plans/entities/subscription-plan.entity';
import { AvailabilitySlot } from 'src/availability-slots/entities/availability-slot.entity';
import { Specialization } from '../../specializations/entities/specialization.entity';

@Entity('dermatologists')
export class Dermatologist {
  @PrimaryGeneratedColumn('uuid')
  dermatologistId: string;

  @Column({
    type: 'json',
    nullable: true,
  })
  purchaseHistory: any[];

  @Column({ type: 'int', nullable: true })
  yearsOfExp: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  defaultSlotPrice: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Appointment, (appointment) => appointment.dermatologist)
  appointments: Appointment[];

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => TreatmentRoutine, (routine) => routine.dermatologist)
  treatmentRoutines: TreatmentRoutine[];

  @OneToMany(() => SubscriptionPlan, (plan) => plan.dermatologist)
  subscriptionPlans: SubscriptionPlan[];

  @OneToMany(() => AvailabilitySlot, (slot) => slot.dermatologist)
  slots: AvailabilitySlot[];

  @OneToMany(() => Specialization, (specialization) => specialization.dermatologist)
  specializations: Specialization[];
}
