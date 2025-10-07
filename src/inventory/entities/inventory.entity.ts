import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Batch } from '../../batches/entities/batch.entity';

@Entity('inventory')
@Index(['shopId', 'productId', 'batchId'], { unique: true })
@Index(['shopId'])
@Index(['productId'])
@Index(['batchId'])
export class ShopInventory {
  @PrimaryColumn()
  inventoryId: string;

  @Column()
  shopId: string;

  @Column()
  productId: string;

  @Column()
  address: string;

  @Column({ nullable: true })
  batchId: string;

  @Column({ type: 'int' })
  currentStock: number;

  @Column({ type: 'int' })
  reservedStock: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Batch, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'batchId' })
  batch: Batch;
}
