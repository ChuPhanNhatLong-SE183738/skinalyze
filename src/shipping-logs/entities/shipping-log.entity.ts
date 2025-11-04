import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/entities/user.entity';

export enum ShippingStatus {
  PENDING = 'PENDING',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RETURNED = 'RETURNED',
}

@Entity('shipping_logs')
export class ShippingLog {
  @PrimaryGeneratedColumn('uuid')
  shippingLogId: string;

  // Many-to-One with Order (Order has many ShippingLogs)
  @ManyToOne(() => Order, (order) => order.shippingLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  shippingFee: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  carrierName: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'text', nullable: true })
  unexpectedCase: string;

  @Column({ type: 'boolean', default: false })
  isCodCollected: boolean;

  @Column({ type: 'boolean', default: false })
  isCodTransferred: boolean;

  @Column({
    type: 'enum',
    enum: ShippingStatus,
    default: ShippingStatus.PENDING,
  })
  status: ShippingStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalAmount: number;

  @Column({ type: 'datetime', nullable: true })
  codCollectDate: Date;

  @Column({ type: 'datetime', nullable: true })
  codTransferDate: Date;

  @Column({ type: 'datetime', nullable: true })
  estimatedDeliveryDate: Date;

  @Column({ type: 'datetime', nullable: true })
  returnedDate: Date;

  @Column({ type: 'datetime', nullable: true })
  deliveredDate: Date;

  // 📸 Ảnh bằng chứng hoàn thành giao hàng (multiple images)
  @Column({ type: 'json', nullable: true })
  finishedPictures: string[];

  // Staff người thực hiện ship
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'shippingStaffId' })
  shippingStaff: User;

  @Column({ type: 'uuid', nullable: true })
  shippingStaffId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
