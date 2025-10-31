import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { DiseaseGroup } from 'src/disease-groups/entities/disease-group.entity';

@Entity('skin_analysis')
export class SkinAnalysis {
  @PrimaryGeneratedColumn('uuid')
  analysisId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  source: string;

  @Column({ type: 'text', nullable: true })
  chiefComplaint: string;

  @Column({ type: 'text', nullable: true })
  patientSymptoms: string;

  @Column({
    type: 'json',
    nullable: true,
  })
  imageUrls: string[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  aiDetectedDisease: string;

  @Column({ type: 'text', nullable: true })
  aiDetectedCondition: string;

  @Column({
    type: 'json',
    nullable: true,
  })
  aiRecommendedProducts: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Customer, (customer) => customer.skinAnalysis)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @ManyToOne(() => DiseaseGroup, (group) => group.skinAnalysis)
  @JoinColumn({ name: 'diseaseGroupId' })
  diseaseGroup: DiseaseGroup;
}
