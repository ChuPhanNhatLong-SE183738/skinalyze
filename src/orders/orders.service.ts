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
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment } from '../payments/entities/payment.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CheckoutCartDto, PaymentMethod } from './dto/checkout-cart.dto';
import {
  PaymentStatus,
  PaymentMethod as PaymentEntityMethod,
} from '../payments/entities/payment.entity';
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
import { GhnService } from '../ghn/ghn.service';
import { ShippingMethod } from './dto/confirm-order.dto';
import { GhnRequiredNote } from '../ghn/dto/create-ghn-order.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly cartService: CartService,
    private readonly inventoryService: InventoryService,
    private readonly customersService: CustomersService,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
    private readonly notificationsService: NotificationsService,
    private readonly shippingLogsService: ShippingLogsService,
    private readonly ghnService: GhnService,
  ) {}

  /**
   * Map payment method từ DTO sang Entity
   * COD (cash on delivery) -> CASH
   * WALLET -> WALLET
   * BANKING/BANK_TRANSFER/... -> BANKING
   */
  private mapPaymentMethod(dtoMethod: PaymentMethod): PaymentEntityMethod {
    switch (dtoMethod) {
      case PaymentMethod.COD:
        return PaymentEntityMethod.CASH;
      case PaymentMethod.WALLET:
        return PaymentEntityMethod.WALLET;
      case PaymentMethod.BANKING:
      case PaymentMethod.BANK_TRANSFER:
      case PaymentMethod.MOMO:
      case PaymentMethod.ZALOPAY:
      case PaymentMethod.VNPAY:
        return PaymentEntityMethod.BANKING;
      default:
        return PaymentEntityMethod.CASH; // Default fallback
    }
  }

  async create(createDto: CreateOrderDto): Promise<Order> {
    // Calculate total amount
    const totalAmount = createDto.orderItems.reduce(
      (sum, item) => sum + item.priceAtTime * item.quantity,
      0,
    );

    // Create payment record
    const payment = this.paymentRepository.create({
      paymentCode: `ORD-${Date.now()}`, // Generate payment code
      paymentType: PaymentType.ORDER,
      amount: totalAmount,
      paidAmount: 0,
      paymentMethod: PaymentEntityMethod.CASH, // ✅ Default cash payment
      status: PaymentStatus.PENDING,
    });
    const savedPayment = await this.paymentRepository.save(payment);

    // Create order
    const order = this.orderRepository.create({
      customerId: createDto.customerId,
      paymentId: savedPayment.paymentId,
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
        'customer.user',
        'payment',
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
        'payment',
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
        'payment',
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

    // Update payment status
    if (order.payment) {
      order.payment.status = PaymentStatus.FAILED;
      await this.paymentRepository.save(order.payment);
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
          console.warn(
            `User ${userId} not found for order ${order.orderId}, skipping notification`,
          );
        }
      } catch (error) {
        // Log error but don't fail the order rejection
        console.error('Failed to send rejection notification:', error.message);
      }
    } else {
      console.warn(
        `No valid user found for order ${order.orderId}, skipping notification`,
      );
    }

    return savedOrder;
  }

  /**
   * ✅ Customer đánh dấu đơn hàng là hoàn thành (COMPLETED)
   * Chỉ có thể complete khi order đã DELIVERED
   */
  async completeOrder(
    id: string,
    customerId: string,
    feedback?: string,
  ): Promise<Order> {
    const order = await this.findOne(id);

    // Kiểm tra đơn hàng có thuộc về customer này không
    if (order.customerId !== customerId) {
      throw new BadRequestException(
        'Bạn không có quyền thao tác với đơn hàng này',
      );
    }

    // Chỉ có thể complete khi status là DELIVERED
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException(
        'Chỉ có thể đánh dấu hoàn thành khi đơn hàng đã được giao',
      );
    }

    order.status = OrderStatus.COMPLETED;

    // Lưu feedback nếu có (có thể thêm field feedback vào Order entity nếu cần)
    if (feedback) {
      order.rejectionReason = feedback; // Tạm dùng field này, hoặc tạo field mới
    }

    return await this.orderRepository.save(order);
  }

  async confirmOrder(
    id: string,
    processedBy: string,
    shippingMethod?: ShippingMethod,
  ): Promise<Order> {
    const order = await this.findOne(id);
    order.status = 'CONFIRMED' as any;
    order.processedBy = processedBy;

    // Sử dụng shippingMethod từ staff hoặc từ order.preferredShippingMethod
    const finalShippingMethod =
      shippingMethod ||
      (order.preferredShippingMethod as ShippingMethod) ||
      ShippingMethod.INTERNAL;

    this.logger.log(
      `📦 Confirming order with shipping method: ${finalShippingMethod}`,
    ); // Update payment status to completed
    if (order.payment) {
      order.payment.status = PaymentStatus.COMPLETED;
      order.payment.paidAmount = order.payment.amount;
      order.payment.paidAt = new Date();
      await this.paymentRepository.save(order.payment);
    }

    const savedOrder = await this.orderRepository.save(order);

    // 📦 Tạo shipping log khi order được confirm
    let ghnOrderCode: string | undefined;
    let ghnShippingFee: number | undefined;

    try {
      // 🚚 Nếu chọn GHN → Tạo đơn vận chuyển GHN
      if (finalShippingMethod === ShippingMethod.GHN) {
        this.logger.log(`📦 Creating GHN shipping order for ${order.orderId}`);

        // Calculate total weight from order items (giả sử mỗi sản phẩm 200g)
        const totalWeight = (order.orderItems?.length || 1) * 200;

        try {
          // Convert payment amount to integer (GHN requires int, not string/decimal)
          const codAmount = order.payment?.amount
            ? Math.floor(Number(order.payment.amount))
            : 0;

          const ghnResult = await this.ghnService.createShippingOrder({
            paymentTypeId: 1, // Shop trả phí ship
            note: order.notes || 'Đơn hàng Skinalyze',
            requiredNote: GhnRequiredNote.NO_OPEN,
            returnPhone: '0332190444',
            returnAddress: 'Đại Học FPT TP.HCM',
            toName: order.customer?.user?.fullName || 'Khách hàng',
            toPhone: order.customer?.user?.phone || '0000000000',
            toAddress: order.shippingAddress,
            toWardCode: '20308', // Mã phường (cần cập nhật từ order)
            toDistrictId: 1444, // Mã quận (cần cập nhật từ order)
            codAmount: codAmount, // Số tiền thu hộ COD (integer)
            content: 'Đơn hàng mỹ phẩm Skinalyze',
            weight: totalWeight,
            length: Math.floor(Math.random() * 20) + 10, // 10-30 cm
            width: Math.floor(Math.random() * 15) + 10, // 10-25 cm
            height: Math.floor(Math.random() * 10) + 5, // 5-15 cm
            items:
              order.orderItems?.map((item) => ({
                name: item.product?.productName || 'Sản phẩm',
                quantity: item.quantity,
                price: item.priceAtTime,
              })) || [],
          });

          ghnOrderCode = ghnResult.data.order_code;
          ghnShippingFee = ghnResult.data.total_fee;

          this.logger.log(
            `✅ GHN order created: ${ghnOrderCode}, Fee: ${ghnShippingFee}`,
          );
        } catch (ghnError) {
          this.logger.error(
            `❌ Failed to create GHN order: ${ghnError.message}`,
          );
          // Vẫn tạo shipping log nhưng không có GHN tracking
        }
      }

      // Tạo shipping log với thông tin GHN (nếu có)
      await this.shippingLogsService.create({
        orderId: order.orderId,
        status: ShippingStatus.PENDING,
        totalAmount: order.payment?.amount || 0,
        note:
          finalShippingMethod === ShippingMethod.GHN
            ? `Đơn hàng giao qua GHN${ghnOrderCode ? ` - Mã vận đơn: ${ghnOrderCode}` : ''}`
            : 'Đơn hàng đã được xác nhận, đang chờ xử lý',
        shippingMethod: finalShippingMethod,
        ghnOrderCode: ghnOrderCode,
        ghnShippingFee: ghnShippingFee,
      });

      this.logger.log(
        `✅ Created shipping log for order ${order.orderId} (Method: ${finalShippingMethod})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create shipping log for order ${order.orderId}:`,
        error.message,
      );
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
              totalAmount: order.payment?.amount,
            },
          });
        } else {
          console.warn(
            `User ${userId} not found for order ${order.orderId}, skipping notification`,
          );
        }
      } catch (error) {
        console.error(
          'Failed to send confirmation notification:',
          error.message,
        );
      }
    } else {
      console.warn(
        `No valid user found for order ${order.orderId}, skipping notification`,
      );
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

    // 2.1. ✅ LỌC ITEMS DỰA TRÊN selectedProductIds HOẶC FIELD selected
    let selectedItems;

    if (
      checkoutDto.selectedProductIds &&
      checkoutDto.selectedProductIds.length > 0
    ) {
      selectedItems = cart.items.filter((item) =>
        checkoutDto.selectedProductIds!.includes(item.productId),
      );
      this.logger.log(
        `📦 Checkout from selectedProductIds: ${checkoutDto.selectedProductIds.join(', ')}`,
      );
    } else {
      // Nếu không → dùng field selected=true trong cart
      selectedItems = this.cartService.getSelectedItems(cart);
      this.logger.log(`📦 Checkout from cart selection (selected=true)`);
    }

    if (selectedItems.length === 0) {
      throw new BadRequestException(
        'Vui lòng chọn ít nhất một sản phẩm để thanh toán',
      );
    }

    this.logger.log(
      `📦 Checkout ${selectedItems.length}/${cart.items.length} selected items`,
    );

    // 2.5. ✅ VALIDATE INVENTORY CHỈ CHO SELECTED ITEMS
    this.logger.log('🔍 Validating inventory for selected items...');
    for (const cartItem of selectedItems) {
      try {
        // Kiểm tra xem có đủ reserved quantity không
        const canConfirm = await this.inventoryService.canConfirmSale(
          cartItem.productId,
          cartItem.quantity,
        );

        if (!canConfirm) {
          throw new BadRequestException(
            `Sản phẩm "${cartItem.productName}" không đủ hàng đã reserve. Vui lòng kiểm tra lại giỏ hàng.`,
          );
        }
      } catch (error) {
        this.logger.error(
          `❌ Inventory validation failed for ${cartItem.productId}: ${error.message}`,
        );
        throw new BadRequestException(
          `Không thể xác nhận tồn kho cho "${cartItem.productName}". ${error.message}`,
        );
      }
    }
    this.logger.log('✅ All inventory validated successfully');

    // 3. Tính total amount CHỈ TỪ SELECTED ITEMS (hoặc dùng từ DTO nếu có)
    let totalAmount: number;

    if (checkoutDto.totalAmount && checkoutDto.totalAmount > 0) {
      totalAmount = checkoutDto.totalAmount;
      this.logger.log(`💰 Using totalAmount from checkout: ${totalAmount} VND`);
    } else {
      totalAmount = selectedItems.reduce(
        (sum, item) => sum + (item.price || 0) * item.quantity,
        0,
      );
      this.logger.log(
        `💰 Calculated totalAmount from cart: ${totalAmount} VND`,
      );
    }

    // 4. 💰 XỬ LÝ PHƯƠNG THỨC THANH TOÁN
    const paymentMethod = checkoutDto.paymentMethod || PaymentMethod.COD;
    const useWallet =
      checkoutDto.useWallet || paymentMethod === PaymentMethod.WALLET;

    // 🆕 NẾU LÀ BANKING: CHỈ TẠO PAYMENT, KHÔNG TẠO ORDER
    if (paymentMethod === PaymentMethod.BANKING && !useWallet) {
      this.logger.log(`💳 BANKING checkout - Creating payment only`);

      // Tạo payment với SELECTED items data
      const payment = await this.paymentsService.createPayment({
        paymentType: PaymentType.ORDER,
        customerId: customer.customerId,
        userId: userId,
        cartData: { items: selectedItems }, // ✅ Wrap in object with items property
        shippingAddress: checkoutDto.shippingAddress,
        orderNotes: checkoutDto.notes,
        amount: totalAmount,
        paymentMethod: PaymentEntityMethod.BANKING,
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
        message:
          'Vui lòng thanh toán để hoàn tất đơn hàng. Đơn hàng sẽ được tạo sau khi chúng tôi nhận được thanh toán.',
      };
    }

    // 📦 COD & WALLET: TẠO ORDER NGAY
    let orderStatus: any = 'PENDING';
    let paymentStatus = PaymentStatus.PENDING;
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
      paymentStatus = PaymentStatus.COMPLETED;

      console.log(
        `✅ Paid by wallet: ${totalAmount} VND. New balance: ${newBalance} VND`,
      );
    }

    // 5. Tạo payment record
    const paymentData: any = {
      paymentCode: `ORD-${Date.now()}`,
      paymentType: PaymentType.ORDER,
      customerId: customer.customerId,
      userId: userId,
      amount: totalAmount,
      paidAmount: useWallet ? totalAmount : 0,
      paymentMethod: this.mapPaymentMethod(paymentMethod), // ✅ Map COD -> CASH
      status: paymentStatus,
    };

    // Only set paidAt if payment is completed
    if (useWallet) {
      paymentData.paidAt = new Date();
    }

    const payment = this.paymentRepository.create(
      paymentData,
    ) as unknown as Payment;
    const savedPayment = await this.paymentRepository.save(payment);

    // 6. Tạo order
    const order = this.orderRepository.create({
      customerId: customer.customerId,
      paymentId: savedPayment.paymentId,
      shippingAddress: checkoutDto.shippingAddress,
      notes: checkoutDto.notes,
      status: orderStatus,
      preferredShippingMethod: checkoutDto.shippingMethod || 'INTERNAL',
    });
    const savedOrder = await this.orderRepository.save(order);

    const orderItems = selectedItems.map((cartItem) =>
      this.orderItemRepository.create({
        orderId: savedOrder.orderId,
        productId: cartItem.productId,
        priceAtTime: cartItem.price || 0,
        quantity: cartItem.quantity,
      }),
    );
    await this.orderItemRepository.save(orderItems);

    try {
      this.logger.log('📦 Confirming sales in inventory...');
      for (const cartItem of selectedItems) {
        await this.inventoryService.confirmSale(
          cartItem.productId,
          cartItem.quantity,
        );
        this.logger.log(
          `✅ Confirmed ${cartItem.quantity}x ${cartItem.productName}`,
        );
      }
    } catch (error) {
      this.logger.error(`❌ Failed to confirm sales: ${error.message}`);

      // ⚠️ ROLLBACK: Xóa order và payment vừa tạo
      this.logger.warn(`🔄 Rolling back order ${savedOrder.orderId}...`);
      await this.orderItemRepository.delete({ orderId: savedOrder.orderId });
      await this.orderRepository.delete({ orderId: savedOrder.orderId });
      await this.paymentRepository.delete({
        paymentId: savedPayment.paymentId,
      });

      throw new BadRequestException(
        `Không thể hoàn tất đơn hàng: ${error.message}. Vui lòng thử lại.`,
      );
    }

    // 10. Xóa items đã checkout khỏi cart
    const productIdsToRemove = selectedItems.map((item) => item.productId);
    await this.cartService.removeItemsByProductIds(userId, productIdsToRemove);

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
    paymentId: number;
  }): Promise<Order> {
    const {
      customerId,
      cartItems,
      shippingAddress,
      notes,
      totalAmount,
      paymentId,
    } = data;

    // 1. Update payment status to completed (should already be done in webhook)
    const payment = await this.paymentRepository.findOne({
      where: { paymentId },
    });

    if (payment && payment.status !== PaymentStatus.COMPLETED) {
      payment.status = PaymentStatus.COMPLETED;
      payment.paidAmount = totalAmount;
      payment.paidAt = new Date();
      await this.paymentRepository.save(payment);
    }

    // 2. Tạo order với status CONFIRMED
    const order = this.orderRepository.create({
      customerId,
      paymentId: paymentId,
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
