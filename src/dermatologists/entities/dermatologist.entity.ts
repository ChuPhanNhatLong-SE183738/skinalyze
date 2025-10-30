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

@Entity('dermatologists')
export class Dermatologist {
  @PrimaryGeneratedColumn('uuid')
  dermatologistId: string;

  @Column({
    type: 'json',
    nullable: true,
  })
  purchaseHistory: any[];

  @Column({
    type: 'json',
    nullable: true,
  })
  availability: any[];

  @Column({ type: 'int', nullable: true })
  yearsOfExp: number;

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
}
