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
import { Dermatologist } from '../../dermatologists/entities/dermatologist.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { RoadmapDetail } from '../../roadmap-details/entities/roadmap-detail.entity';

@Entity('treatment_roadmaps')
export class TreatmentRoadmap {
  @PrimaryGeneratedColumn('uuid')
  roadmapId: string;

  @Column({ type: 'uuid' })
  dermatologistId: string;

  @Column({ type: 'uuid' })
  customerId: string;

  @Column({ type: 'uuid', nullable: true })
  appointmentId: string;

  @ManyToOne(
    () => Dermatologist,
    (dermatologist) => dermatologist.treatmentRoadmaps,
  )
  @JoinColumn({ name: 'dermatologistId' })
  dermatologist: Dermatologist;

  @ManyToOne(() => Customer, (customer) => customer.treatmentRoadmaps)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @ManyToOne(() => Appointment, { nullable: true })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

  @OneToMany(() => RoadmapDetail, (detail) => detail.treatmentRoadmap)
  roadmapDetails: RoadmapDetail[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
