import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { StockMovement } from './stock-movement.entity';
import { Batch } from '../../batches/entities/batch.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('stock_movement_items')
@Index(['movementId'])
@Index(['productId'])
@Index(['batchId'])
export class StockMovementItem {
  @PrimaryColumn()
  stockMovementItemId: string;

  @Column()
  movementId: string;

  @Column()
  productId: string;

  @Column({ nullable: true })
  batchId: string;

  @Column({ type: 'int' })
  quantity: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => StockMovement, (movement) => movement.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'movementId' })
  movement: StockMovement;

  @ManyToOne(() => Batch, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'batchId' })
  batch: Batch;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;
}
