import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CheckoutCartDto, PaymentMethod } from './dto/checkout-cart.dto';
import { TransactionStatus } from '../transactions/entities/transaction.entity';
import { CartService } from '../cart/cart.service';
import { InventoryService } from '../inventory/inventory.service';
import { CustomersService } from '../customers/customers.service';
import { UsersService } from '../users/users.service';
import { PaymentsService } from '../payments/payments.service';
import { PaymentType } from '../payments/entities/payment.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { ShippingLogsService } from '../shipping-logs/shipping-logs.service';
import { ShippingStatus } from '../shipping-logs/entities/shipping-log.entity';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly cartService: CartService,
    private readonly inventoryService: InventoryService,
    private readonly customersService: CustomersService,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
    private readonly notificationsService: NotificationsService,
    private readonly shippingLogsService: ShippingLogsService,
  ) {}

  async create(createDto: CreateOrderDto): Promise<Order> {
    // Calculate total amount
    const totalAmount = createDto.orderItems.reduce(
      (sum, item) => sum + item.priceAtTime * item.quantity,
      0,
    );

    // Create transaction
    const transaction = this.transactionRepository.create({
      totalAmount,
      status: TransactionStatus.PENDING,
    });
    const savedTransaction = await this.transactionRepository.save(transaction);

    // Create order
    const order = this.orderRepository.create({
      customerId: createDto.customerId,
      transactionId: savedTransaction.transactionId,
      shippingAddress: createDto.shippingAddress,
      notes: createDto.notes,
      status: createDto.status,
    });
    const savedOrder = await this.orderRepository.save(order);

    // Create order items
    const orderItems = createDto.orderItems.map((item) =>
      this.orderItemRepository.create({
        orderId: savedOrder.orderId,
        productId: item.productId,
        priceAtTime: item.priceAtTime,
        quantity: item.quantity,
      }),
    );
    await this.orderItemRepository.save(orderItems);

    return this.findOne(savedOrder.orderId);
  }

  async findAll(): Promise<Order[]> {
    return await this.orderRepository.find({
      relations: [
        'customer',
        'transaction',
        'orderItems',
        'orderItems.product',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderId: id },
      relations: [
        'customer',
        'customer.user',
        'transaction',
        'orderItems',
        'orderItems.product',
        'shippingLogs',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    return await this.orderRepository.find({
      where: { customerId },
      relations: [
        'customer',
        'customer.user',
        'transaction',
        'orderItems',
        'orderItems.product',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);
    Object.assign(order, updateDto);
    return await this.orderRepository.save(order);
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);
    await this.orderRepository.remove(order);
  }

  async cancelOrder(id: string, reason?: string): Promise<Order> {
    const order = await this.findOne(id);

    if (order.status === 'DELIVERED') {
      throw new BadRequestException('Cannot cancel delivered order');
    }

    order.status = 'REJECTED' as any;
    if (reason) {
      order.rejectionReason = reason;
    }

    // Update transaction status
    if (order.transaction) {
      order.transaction.status = TransactionStatus.CANCELLED;
      await this.transactionRepository.save(order.transaction);
    }

    const savedOrder = await this.orderRepository.save(order);

    // 🔔 Gửi notification cho customer  
    // Check if customer has valid user before sending notification
    const userId = order.customer?.user?.userId;
    if (userId) {
      try {
        // Verify user exists before creating notification
        const userExists = await this.usersService.findOne(userId);
        
        if (userExists) {
          await this.notificationsService.create({
            userId: userId,
            type: NotificationType.ORDER,
            title: '❌ Đơn hàng bị từ chối',
            message: reason 
              ? `Đơn hàng #${order.orderId.slice(0, 8)} đã bị từ chối. Lý do: ${reason}`
              : `Đơn hàng #${order.orderId.slice(0, 8)} đã bị từ chối.`,
            data: {
              orderId: order.orderId,
              status: order.status,
              reason: reason,
            },
          });
        } else {
          console.warn(`User ${userId} not found for order ${order.orderId}, skipping notification`);
        }
      } catch (error) {
        // Log error but don't fail the order rejection
        console.error('Failed to send rejection notification:', error.message);
      }
    } else {
      console.warn(`No valid user found for order ${order.orderId}, skipping notification`);
    }

    return savedOrder;
  }

  async confirmOrder(id: string, processedBy: string): Promise<Order> {
    const order = await this.findOne(id);
    order.status = 'CONFIRMED' as any;
    order.processedBy = processedBy;

    // Update transaction
    if (order.transaction) {
      order.transaction.status = TransactionStatus.COMPLETED;
      await this.transactionRepository.save(order.transaction);
    }

    const savedOrder = await this.orderRepository.save(order);

    try {
      await this.shippingLogsService.create({
        orderId: order.orderId,
        status: ShippingStatus.PENDING,
        totalAmount: order.transaction?.totalAmount || 0,
        note: 'Đơn hàng đã được xác nhận, đang chờ xử lý',
      });
      this.logger.log(`✅ Created shipping log for order ${order.orderId}`);
    } catch (error) {
      this.logger.error(`Failed to create shipping log for order ${order.orderId}:`, error.message);
    }

    // 🔔 Gửi notification cho customer
    const userId = order.customer?.user?.userId;
    if (userId) {
      try {
        const userExists = await this.usersService.findOne(userId);
        
        if (userExists) {
          await this.notificationsService.create({
            userId: userId,
            type: NotificationType.ORDER,
            title: '✅ Đơn hàng đã được xác nhận',
            message: `Đơn hàng #${order.orderId.slice(0, 8)} đã được xác nhận và đang được chuẩn bị. Chúng tôi sẽ giao hàng sớm nhất có thể!`,
            data: {
              orderId: order.orderId,
              status: order.status,
              totalAmount: order.transaction?.totalAmount,
            },
          });
        } else {
          console.warn(`User ${userId} not found for order ${order.orderId}, skipping notification`);
        }
      } catch (error) {
        console.error('Failed to send confirmation notification:', error.message);
      }
    } else {
      console.warn(`No valid user found for order ${order.orderId}, skipping notification`);
    }

    return savedOrder;
  }

  /**
   * 🛒 CHECKOUT CART - Chuyển cart items thành order
   * 💰 Support: wallet, COD, banking (SePay)
   */
  async checkoutCart(
    userId: string,
    checkoutDto: CheckoutCartDto,
  ): Promise<any> {
    // 1. Lấy customer từ userId
    const customer = await this.customersService.findByUserId(userId);
    if (!customer) {
      throw new NotFoundException(
        'Customer not found for this user. Please complete your profile.',
      );
    }

    // 2. Lấy cart của user
    const cart = await this.cartService.getCart(userId);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // 3. Tính total amount từ cart
    const totalAmount = cart.items.reduce(
      (sum, item) => sum + (item.price || 0) * item.quantity,
      0,
    );

    // 4. 💰 XỬ LÝ PHƯƠNG THỨC THANH TOÁN
    const paymentMethod = checkoutDto.paymentMethod || PaymentMethod.COD;
    const useWallet =
      checkoutDto.useWallet || paymentMethod === PaymentMethod.WALLET;

    // 🆕 NẾU LÀ BANKING: CHỈ TẠO PAYMENT, KHÔNG TẠO ORDER
    if (paymentMethod === PaymentMethod.BANKING && !useWallet) {
      this.logger.log(`💳 BANKING checkout - Creating payment only`);

      // Tạo payment với cart data
      const payment = await this.paymentsService.createPayment({
        paymentType: PaymentType.ORDER,
        customerId: customer.customerId,
        userId: userId,
        cartData: cart.items,
        shippingAddress: checkoutDto.shippingAddress,
        orderNotes: checkoutDto.notes,
        amount: totalAmount,
        paymentMethod: 'banking' as any,
      });

      // Generate QR code URL
      const qrCodeUrl = `https://img.vietqr.io/image/MB-0347178790-compact2.png?amount=${totalAmount}&addInfo=${payment.paymentCode}&accountName=CHU PHAN NHAT LONG`;

      // ❌ KHÔNG xóa cart (giữ lại để tạo order sau khi thanh toán)
      // ❌ KHÔNG trừ inventory
      // ❌ KHÔNG tạo order

      return {
        payment: {
          paymentId: payment.paymentId,
          paymentCode: payment.paymentCode,
          amount: totalAmount,
          status: payment.status,
          expiredAt: payment.expiredAt,
          qrCodeUrl,
          bankingInfo: {
            bankName: 'MBBank',
            accountNumber: '0347178790',
            accountName: 'CHU PHAN NHAT LONG',
            amount: totalAmount,
            transferContent: payment.paymentCode,
            qrCode: qrCodeUrl,
          },
          instructions: [
            '1. Quét mã QR bằng app ngân hàng',
            '2. Hoặc chuyển khoản thủ công với thông tin trên',
            `3. Nội dung CK: ${payment.paymentCode} (PHẢI CHÍNH XÁC)`,
            '4. Đơn hàng sẽ tự động được tạo sau khi thanh toán',
            '5. Thời gian xử lý: Real-time (vài giây)',
          ],
        },
        message: 'Vui lòng thanh toán để hoàn tất đơn hàng. Đơn hàng sẽ được tạo sau khi chúng tôi nhận được thanh toán.',
      };
    }

    // 📦 COD & WALLET: TẠO ORDER NGAY
    let orderStatus: any = 'PENDING';
    let transactionStatus = TransactionStatus.PENDING;
    let paymentInfo: any = null; // For storing payment info (not used for COD/WALLET in new flow)

    // 4a. Thanh toán bằng WALLET
    if (useWallet) {
      const user = await this.usersService.findOne(userId);
      const userBalance = parseFloat(user.balance.toString());

      if (userBalance < totalAmount) {
        throw new BadRequestException(
          `Số dư không đủ. Cần ${totalAmount.toLocaleString('vi-VN')} VND, hiện có ${userBalance.toLocaleString('vi-VN')} VND. Vui lòng nạp thêm tiền.`,
        );
      }

      // Trừ tiền từ balance
      const newBalance = userBalance - totalAmount;
      await this.usersService.update(userId, { balance: newBalance });

      orderStatus = 'CONFIRMED';
      transactionStatus = TransactionStatus.COMPLETED;

      console.log(
        `✅ Paid by wallet: ${totalAmount} VND. New balance: ${newBalance} VND`,
      );
    }

    // 5. Tạo transaction
    const transaction = this.transactionRepository.create({
      totalAmount,
      status: transactionStatus,
      paymentMethod: paymentMethod,
    });
    const savedTransaction = await this.transactionRepository.save(transaction);

    // 6. Tạo order
    const order = this.orderRepository.create({
      customerId: customer.customerId,
      transactionId: savedTransaction.transactionId,
      shippingAddress: checkoutDto.shippingAddress,
      notes: checkoutDto.notes,
      status: orderStatus,
    });
    const savedOrder = await this.orderRepository.save(order);

    // 7. Tạo order items từ cart items
    const orderItems = cart.items.map((cartItem) =>
      this.orderItemRepository.create({
        orderId: savedOrder.orderId,
        productId: cartItem.productId,
        priceAtTime: cartItem.price || 0,
        quantity: cartItem.quantity,
      }),
    );
    await this.orderItemRepository.save(orderItems);

    // 8. Confirm sale trong inventory (chuyển reserve → sold)
    for (const cartItem of cart.items) {
      await this.inventoryService.confirmSale(
        cartItem.productId,
        cartItem.quantity,
      );
    }

    // 9. 💳 PAYMENT INFO (KHÔNG CẦN TẠO PAYMENT CHO BANKING NỮA - ĐÃ TẠO Ở TRÊN)
    // COD & WALLET không cần payment info vì đã xử lý rồi

    // 10. Xóa cart sau khi checkout thành công (CHỈ COD & WALLET)
    await this.cartService.clearCart(userId);

    // 11. Trả về order (CHỈ COD & WALLET)
    const fullOrder = await this.findOne(savedOrder.orderId);

    return {
      order: fullOrder,
      message: useWallet 
        ? 'Đơn hàng đã được tạo và thanh toán qua ví thành công.'
        : 'Đơn hàng đã được tạo thành công. Vui lòng thanh toán khi nhận hàng (COD).',
    };
  }

  /**
   * Get customer by userId (helper method for controller)
   */
  async getCustomerByUserId(userId: string) {
    return await this.customersService.findByUserId(userId);
  }

  /**
   * 💳 TẠO ORDER TỪ PAYMENT (sau khi thanh toán thành công)
   * Dùng khi payment completed → tạo order với status CONFIRMED
   */
  async createOrderFromPayment(data: {
    customerId: string;
    cartItems: any[];
    shippingAddress: string;
    notes?: string;
    totalAmount: number;
  }): Promise<Order> {
    const { customerId, cartItems, shippingAddress, notes, totalAmount } = data;

    // 1. Tạo transaction với status COMPLETED
    const transaction = this.transactionRepository.create({
      totalAmount,
      status: TransactionStatus.COMPLETED,
      paymentMethod: 'banking',
    });
    const savedTransaction = await this.transactionRepository.save(transaction);

    // 2. Tạo order với status CONFIRMED
    const order = this.orderRepository.create({
      customerId,
      transactionId: savedTransaction.transactionId,
      shippingAddress,
      notes,
      status: 'CONFIRMED' as any,
    });
    const savedOrder = await this.orderRepository.save(order);

    // 3. Tạo order items
    const orderItems = cartItems.map((item) =>
      this.orderItemRepository.create({
        orderId: savedOrder.orderId,
        productId: item.productId,
        priceAtTime: item.price || 0,
        quantity: item.quantity,
      }),
    );
    await this.orderItemRepository.save(orderItems);

    // 4. Trừ stock trực tiếp (đã thanh toán rồi, không cần reserve)
    for (const item of cartItems) {
      await this.inventoryService.reduceStock(item.productId, item.quantity);
    }

    this.logger.log(
      `✅ Order created from payment: #${savedOrder.orderId} - Amount: ${totalAmount}`,
    );

    return savedOrder;
  }
}
