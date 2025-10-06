import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Batch } from '../../batches/entities/batch.entity';
import { StockMovementItem } from './stock-movement-item.entity';

export enum MovementType {
  IMPORT = 'IMPORT',
  TRANSFER = 'TRANSFER',
  EXPORT = 'EXPORT',
}

export enum MovementStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('stock_movements')
@Index(['movementType'])
@Index(['status'])
@Index(['sourceShopId'])
@Index(['destinationShopId'])
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  movementId: string;

  @Column({ type: 'enum', enum: MovementType })
  movementType: MovementType;

  @Column({
    type: 'enum',
    enum: MovementStatus,
    default: MovementStatus.PENDING,
  })
  status: MovementStatus;

  @Column({ nullable: true })
  sourceShopId: string;

  @Column({ nullable: true })
  destinationShopId: string;

  @Column({ nullable: true })
  batchId: string;

  @Column({ type: 'text' })
  reason: string;

  @Column()
  requestedBy: string;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'datetime', nullable: true })
  approvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requestedBy' })
  requester: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approvedBy' })
  approver: User;

  @ManyToOne(() => Batch, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'batchId' })
  batch: Batch;

  @OneToMany(() => StockMovementItem, (item) => item.movement, {
    cascade: true,
  })
  items: StockMovementItem[];
}
