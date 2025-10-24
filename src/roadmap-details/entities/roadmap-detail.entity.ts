import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TreatmentRoadmap } from '../../treatment-roadmaps/entities/treatment-roadmap.entity';

@Entity('roadmap_details')
export class RoadmapDetail {
  @PrimaryGeneratedColumn('uuid')
  roadmapDetailId: string;

  @Column({ type: 'uuid' })
  roadmapId: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  content: string;

  // Array of product IDs
  @Column({ type: 'simple-json' })
  productId: string[];

  @ManyToOne(() => TreatmentRoadmap, (roadmap) => roadmap.roadmapDetails)
  @JoinColumn({ name: 'roadmapId' })
  treatmentRoadmap: TreatmentRoadmap;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
