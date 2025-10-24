import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SkinAnalysis } from '../../skin-analysis/entities/skin-analysis.entity';
import { TreatmentRoadmap } from '../../treatment-roadmaps/entities/treatment-roadmap.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  customerId: string;

  // Foreign key reference to User
  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @OneToMany(() => TreatmentRoadmap, (roadmap) => roadmap.customer)
  treatmentRoadmaps: TreatmentRoadmap[];

  @Column({ type: 'int', default: 0 })
  aiUsageAmount: number;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date | null;

  @Column({ type: 'int', default: 0 })
  sessionRemaining: number;

  @Column({ type: 'json', nullable: true })
  subscriptionId: string[] | null;

  // One-to-Many relationship with Skin Analysis
  @OneToMany(() => SkinAnalysis, (analysis) => analysis.customer)
  skinAnalyses: SkinAnalysis[];

  // Array of analysis IDs (deprecated - use skinAnalyses relation instead)
  @Column({ type: 'json', nullable: true })
  analysisId: string[];

  // Purchase history (will link to orders/transactions later)
  @Column({ type: 'json', nullable: true })
  purchaseHistory: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
