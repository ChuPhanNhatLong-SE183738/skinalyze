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

@Entity('skin_analysis')
export class SkinAnalysis {
  @PrimaryGeneratedColumn('uuid')
  analysisId: string;

  @Column({ type: 'varchar', length: 255 })
  customerId: string;

  @Column({ type: 'enum', enum: ['AI_SCAN', 'MANUAL'] })
  source: string;

  @Column({ type: 'text', nullable: true })
  chiefComplaint: string | null;

  @Column({ type: 'text', nullable: true })
  patientSymptoms: string | null;

  @Column({ type: 'simple-array' })
  imageUrls: string[];

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  aiDetectedDisease: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  aiDetectedCondition: string | null;

  @Column({ type: 'json', nullable: true })
  aiRecommendedProducts: any[] | null;

  @Column({ type: 'simple-array', nullable: true })
  mask: string[] | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Customer, (customer) => customer.skinAnalyses)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;
}
