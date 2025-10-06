import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { Batch } from './batch.entity';

@Entity('batch_items')
export class BatchItem {
  @PrimaryColumn()
  batchId: string;

  @PrimaryColumn()
  productId: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'int' })
  importPrice: number;

  @Column({ length: 255, nullable: true })
  batch: string;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ type: 'int' })
  stockRemain: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Batch, (batch) => batch.batchItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batchId' })
  batchRelation: Batch;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;
}
