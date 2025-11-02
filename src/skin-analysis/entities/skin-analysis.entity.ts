import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
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

  @Column()
  customerId: string;

  @Column({
    type: 'enum',
    enum: ['AI_SCAN', 'MANUAL'],
  })
  source: string;

  @Column({ type: 'text', nullable: true })
  chiefComplaint: string;

  @Column({ type: 'text', nullable: true })
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

  @Column({ type: 'longtext', nullable: true })
  mask: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Customer, (customer) => customer.skinAnalyses)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;
}
