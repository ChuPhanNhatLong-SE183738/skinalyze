import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { DiseaseGroup } from '../../disease-groups/entities/disease-group.entity';

@Entity('skin_analysis')
export class SkinAnalysis {
  @PrimaryColumn()
  analysisId: string;

  @Column()
  customerId: string;

  @Column()
  diseaseGroupId: string;

  @Column({
    type: 'enum',
    enum: ['AI_SCAN', 'MANUAL'],
  })
  source: string;

  @Column({ type: 'text' })
  chiefComplaint: string;

  @Column({ type: 'text' })
  patientSymptoms: string;

  @Column('simple-array')
  imageUrls: string[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  aiDetectedDisease: string;

  @Column({ nullable: true })
  aiDetectedCondition: string;

  @Column('simple-json', { nullable: true })
  aiRecommendedProducts: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Customer, (customer) => customer.skinAnalyses)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @ManyToOne(() => DiseaseGroup, (diseaseGroup) => diseaseGroup.skinAnalyses)
  @JoinColumn({ name: 'diseaseGroupId' })
  diseaseGroup: DiseaseGroup;
}