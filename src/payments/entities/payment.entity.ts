import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

export enum PaymentMethod {
  BANKING = 'banking',
  CASH = 'cash',
  WALLET = 'wallet',
}

export enum PaymentType {
  ORDER = 'order',       // Thanh toán đơn hàng
  TOPUP = 'topup',       // Nạp tiền vào ví
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  paymentId: number;

  @Column({ unique: true })
  paymentCode: string; // Mã thanh toán để khách nhập vào nội dung CK

  @Column({
    type: 'enum',
    enum: PaymentType,
    default: PaymentType.ORDER,
  })
  paymentType: PaymentType; // Phân biệt thanh toán order hay topup

  @Column({ type: 'varchar', length: 36, nullable: true })
  orderId: string;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'varchar', length: 36, nullable: true })
  userId: string; // User ID cho topup

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number; // Số tiền cần thanh toán

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  paidAmount: number; // Số tiền đã thanh toán

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.BANKING,
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  // Thông tin từ SePay webhook
  @Column({ nullable: true })
  sepayTransactionId: number; // ID giao dịch trên SePay

  @Column({ nullable: true })
  gateway: string; // Vietcombank, Techcombank, etc.

  @Column({ nullable: true })
  accountNumber: string; // Số TK ngân hàng nhận tiền

  @Column({ nullable: true })
  referenceCode: string; // Mã tham chiếu SMS

  @Column({ type: 'text', nullable: true })
  transferContent: string; // Nội dung chuyển khoản thực tế

  @Column({ type: 'datetime', nullable: true })
  transactionDate: Date; // Thời gian giao dịch phía ngân hàng

  @Column({ type: 'text', nullable: true })
  webhookData: string; // Lưu toàn bộ webhook data (JSON)

  @Column({ type: 'text', nullable: true })
  cartData: string; // Lưu cart data để tạo order sau khi thanh toán (JSON)

  @Column({ type: 'text', nullable: true })
  shippingAddress: string; // Địa chỉ giao hàng

  @Column({ type: 'text', nullable: true })
  orderNotes: string; // Ghi chú đơn hàng

  @Column({ type: 'varchar', length: 36, nullable: true })
  customerId: string; // Customer ID để tạo order sau

  @Column({ type: 'datetime', nullable: true })
  expiredAt: Date; // Thời gian hết hạn thanh toán

  @Column({ type: 'datetime', nullable: true })
  paidAt: Date; // Thời gian thanh toán thành công

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
