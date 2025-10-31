import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TreatmentRoutine } from '../../treatment-routines/entities/treatment-routine.entity';

@Entity('routine_details')
export class RoutineDetail {
  @PrimaryGeneratedColumn('uuid')
  routineDetailId: string;

  @Column({
    type: 'json',
    nullable: true,
  })
  productIds: string[];

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => TreatmentRoutine, (routine) => routine.routineDetails)
  @JoinColumn({ name: 'routineId' })
  treatmentRoutine: TreatmentRoutine;
}
