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
import { TreatmentRoadmap } from '../../treatment-roadmaps/entities/treatment-roadmap.entity';

@Entity('dermatologists')
export class Dermatologist {
  @PrimaryGeneratedColumn('uuid')
  dermatologistId: string;

  // Foreign key reference to User
  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @OneToMany(() => TreatmentRoadmap, (roadmap) => roadmap.dermatologist)
  treatmentRoadmaps: TreatmentRoadmap[];

  @Column({ type: 'json', nullable: true })
  skinAnalysisHistory: any[];

  @Column({ type: 'json', nullable: true })
  purchaseHistory: any[];

  @Column({ type: 'json', nullable: true })
  availability: any[];

  @Column({ type: 'int', nullable: true })
  yearsOfExp: number;

  // Use simple-array for string arrays
  @Column({ type: 'simple-array', nullable: true })
  specializations: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
