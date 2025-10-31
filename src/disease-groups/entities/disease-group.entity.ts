import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Disease } from '../../diseases/entities/disease.entity';
import { SkinAnalysis } from 'src/skin-analysis/entities/skin-analysis.entity';

@Entity('disease_groups')
export class DiseaseGroup {
  @PrimaryGeneratedColumn('uuid')
  diseaseGroupId: string;

  @Column({ unique: true })
  name: string;

  @Column('text')
  description: string;

  @OneToMany(() => Disease, (disease) => disease.diseaseGroup)
  diseases: Disease[];

  @OneToMany(() => SkinAnalysis, (skinAnalysis) => skinAnalysis.diseaseGroup)
  skinAnalyses: SkinAnalysis[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
