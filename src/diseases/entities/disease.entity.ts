import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DiseaseGroup } from '../../disease-groups/entities/disease-group.entity';

export enum SeverityLevel {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  CRITICAL = 'critical',
}

@Entity('diseases')
export class Disease {
  @PrimaryGeneratedColumn('uuid')
  diseaseId: string;

  @Column()
  diseaseGroupId: string;

  @Column()
  diseaseName: string;

  @Column('text')
  description: string;

  @Column('text')
  symptoms: string;

  @Column('text')
  causes: string;

  @Column({ default: false })
  isInfectious: boolean;

  @Column({
    type: 'enum',
    enum: SeverityLevel,
    default: SeverityLevel.MILD,
  })
  severityLevel: SeverityLevel;

  @ManyToOne(() => DiseaseGroup, (group) => group.diseases, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'diseaseGroupId' })
  diseaseGroup: DiseaseGroup;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}