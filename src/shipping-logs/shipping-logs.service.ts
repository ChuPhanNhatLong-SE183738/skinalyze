import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { ShippingLog, ShippingMethod } from './entities/shipping-log.entity';
import { CreateShippingLogDto } from './dto/create-shipping-log.dto';
import { UpdateShippingLogDto } from './dto/update-shipping-log.dto';
import { ShippingStatus } from './entities/shipping-log.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import {
  CreateBatchDeliveryDto,
  AssignGhnOrderDto,
} from './dto/batch-delivery.dto';
import { GhnService } from '../ghn/ghn.service';

@Injectable()
export class ShippingLogsService {
  private readonly logger = new Logger(ShippingLogsService.name);

  constructor(
    @InjectRepository(ShippingLog)
    private readonly shippingLogRepository: Repository<ShippingLog>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly ghnService: GhnService,
  ) {}

  private mapShippingStatusToOrderStatus(
    shippingStatus: ShippingStatus,
  ): OrderStatus {
    const statusMap: Record<ShippingStatus, OrderStatus> = {
      [ShippingStatus.PENDING]: OrderStatus.CONFIRMED,
      [ShippingStatus.PICKED_UP]: OrderStatus.SHIPPING,
      [ShippingStatus.IN_TRANSIT]: OrderStatus.SHIPPING,
      [ShippingStatus.OUT_FOR_DELIVERY]: OrderStatus.SHIPPING,
      [ShippingStatus.DELIVERED]: OrderStatus.DELIVERED,
      [ShippingStatus.FAILED]: OrderStatus.PROCESSING,
      [ShippingStatus.RETURNED]: OrderStatus.CANCELLED,
    };
    return statusMap[shippingStatus];
  }

  private async syncOrderStatus(
    orderId: string,
    shippingStatus: ShippingStatus,
  ): Promise<void> {
    const newOrderStatus = this.mapShippingStatusToOrderStatus(shippingStatus);
    await this.orderRepository.update({ orderId }, { status: newOrderStatus });
    this.logger.log(`✅ Order ${orderId} status synced: ${newOrderStatus}`);
  }

  async create(createDto: CreateShippingLogDto): Promise<ShippingLog> {
    const log = this.shippingLogRepository.create(createDto);
    return await this.shippingLogRepository.save(log);
  }

  async findAll(): Promise<ShippingLog[]> {
    return await this.shippingLogRepository.find({
      relations: [
        'order',
        'order.customer',
        'order.customer.user',
        'order.orderItems',
        'order.orderItems.product',
        'shippingStaff',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 📦 Lấy danh sách đơn hàng chưa có staff nhận (available for pickup)
   */
  async findAvailableForPickup(): Promise<ShippingLog[]> {
    return await this.shippingLogRepository.find({
      where: {
        shippingStaffId: IsNull(),
        status: ShippingStatus.PENDING,
      },
      relations: [
        'order',
        'order.customer',
        'order.customer.user',
        'order.orderItems',
        'order.orderItems.product',
      ],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 👤 Lấy danh sách đơn hàng của một staff cụ thể
   */
  async findByStaffId(staffId: string): Promise<ShippingLog[]> {
    return await this.shippingLogRepository.find({
      where: { shippingStaffId: staffId },
      relations: [
        'order',
        'order.customer',
        'order.customer.user',
        'order.orderItems',
        'order.orderItems.product',
        'shippingStaff',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ShippingLog> {
    const log = await this.shippingLogRepository.findOne({
      where: { shippingLogId: id },
      relations: [
        'order',
        'order.customer',
        'order.customer.user',
        'order.orderItems',
        'order.orderItems.product',
        'shippingStaff',
      ],
    });

    if (!log) {
      throw new NotFoundException(`Shipping log with ID ${id} not found`);
    }

    return log;
  }

  async findByOrderId(orderId: string): Promise<ShippingLog[]> {
    return await this.shippingLogRepository.find({
      where: { orderId },
      relations: [
        'order',
        'order.customer',
        'order.customer.user',
        'order.orderItems',
        'order.orderItems.product',
        'shippingStaff',
      ],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 🤝 Staff tự nhận đơn hàng (self-assign)
   */
  async assignToMe(
    shippingLogId: string,
    staffId: string,
  ): Promise<ShippingLog> {
    const log = await this.findOne(shippingLogId);

    // Kiểm tra đơn hàng đã có staff chưa
    if (log.shippingStaffId) {
      throw new BadRequestException(`Đơn hàng này đã được nhận bởi staff khác`);
    }

    // Kiểm tra status phải là PENDING
    if (log.status !== ShippingStatus.PENDING) {
      throw new BadRequestException(
        `Chỉ có thể nhận đơn hàng có trạng thái PENDING`,
      );
    }

    log.shippingStaffId = staffId;
    log.status = ShippingStatus.PICKED_UP;
    log.note = `Đơn hàng đã được nhận bởi staff vào ${new Date().toLocaleString('vi-VN')}`;

    const savedLog = await this.shippingLogRepository.save(log);

    // 🔄 Đồng bộ Order status sang SHIPPING
    await this.syncOrderStatus(log.orderId, ShippingStatus.PICKED_UP);

    return savedLog;
  }

  /**
   * 👨‍💼 Admin gán staff cho đơn hàng (force assign)
   */
  async assignStaff(
    shippingLogId: string,
    staffId: string,
    force: boolean = false,
  ): Promise<ShippingLog> {
    const log = await this.findOne(shippingLogId);

    // Nếu không force và đã có staff, throw error
    if (!force && log.shippingStaffId) {
      throw new BadRequestException(
        `Đơn hàng này đã được gán cho staff khác. Sử dụng force=true để gán lại.`,
      );
    }

    log.shippingStaffId = staffId;

    // Nếu đơn hàng đang pending, chuyển sang picked_up
    if (log.status === ShippingStatus.PENDING) {
      log.status = ShippingStatus.PICKED_UP;
    }

    const savedLog = await this.shippingLogRepository.save(log);

    // 🔄 Đồng bộ Order status nếu status đã thay đổi
    if (log.status === ShippingStatus.PICKED_UP) {
      await this.syncOrderStatus(log.orderId, ShippingStatus.PICKED_UP);
    }

    return savedLog;
  }

  async update(
    id: string,
    updateDto: UpdateShippingLogDto,
  ): Promise<ShippingLog> {
    const log = await this.findOne(id);
    const oldStatus = log.status;
    Object.assign(log, updateDto);
    const savedLog = await this.shippingLogRepository.save(log);

    // 🔄 Nếu status thay đổi, đồng bộ với Order
    if (updateDto.status && updateDto.status !== oldStatus) {
      await this.syncOrderStatus(log.orderId, updateDto.status);
    }

    return savedLog;
  }

  /**
   * 📸 Upload ảnh bằng chứng hoàn thành đơn hàng
   */
  async uploadFinishedPictures(
    shippingLogId: string,
    files: Express.Multer.File[],
    staffId: string,
  ): Promise<ShippingLog> {
    const log = await this.findOne(shippingLogId);

    // Kiểm tra staff có quyền upload không (phải là staff được assign)
    if (log.shippingStaffId !== staffId) {
      throw new BadRequestException(
        'Bạn không có quyền upload ảnh cho đơn hàng này',
      );
    }

    // Kiểm tra status (chỉ upload khi OUT_FOR_DELIVERY hoặc DELIVERED)
    if (
      log.status !== ShippingStatus.OUT_FOR_DELIVERY &&
      log.status !== ShippingStatus.DELIVERED
    ) {
      throw new BadRequestException(
        'Chỉ có thể upload ảnh khi đơn hàng đang giao hoặc đã giao',
      );
    }

    this.logger.log(
      `Uploading ${files.length} pictures for shipping log ${shippingLogId}`,
    );

    // Upload ảnh lên Cloudinary
    const uploadResults = await this.cloudinaryService.uploadMultipleImages(
      files,
      'shipping-finished',
    );

    // Lấy URLs
    const pictureUrls = uploadResults.map((result) => result.secure_url);

    // Cập nhật vào database
    log.finishedPictures = pictureUrls;
    log.status = ShippingStatus.DELIVERED;
    log.deliveredDate = new Date();

    const updatedLog = await this.shippingLogRepository.save(log);

    // 🔄 Đồng bộ Order status sang DELIVERED
    await this.syncOrderStatus(log.orderId, ShippingStatus.DELIVERED);

    this.logger.log(`✅ Uploaded ${pictureUrls.length} pictures successfully`);

    return updatedLog;
  }

  async remove(id: string): Promise<void> {
    const log = await this.findOne(id);
    await this.shippingLogRepository.remove(log);
  }

  /**
   * 📦 Tạo batch delivery - gom nhiều đơn hàng cùng customer giao 1 lần
   */
  async createBatchDelivery(
    dto: CreateBatchDeliveryDto,
  ): Promise<ShippingLog[]> {
    // Validate tất cả orders tồn tại và cùng customer
    const orders = await this.orderRepository.find({
      where: { orderId: In(dto.orderIds) },
      relations: ['customer', 'shippingLogs'],
    });

    if (orders.length !== dto.orderIds.length) {
      throw new NotFoundException('Some orders not found');
    }

    // Kiểm tra cùng customer
    const customerIds = [...new Set(orders.map((o) => o.customerId))];
    if (customerIds.length > 1) {
      throw new BadRequestException(
        'Cannot batch orders from different customers',
      );
    }

    // Kiểm tra orders chưa có shipping log hoặc đang PENDING
    for (const order of orders) {
      const existingLog = order.shippingLogs?.find(
        (log) =>
          log.status !== ShippingStatus.DELIVERED &&
          log.status !== ShippingStatus.RETURNED,
      );
      if (
        existingLog &&
        existingLog.shippingStaffId &&
        existingLog.shippingStaffId !== dto.shippingStaffId
      ) {
        throw new BadRequestException(
          `Order ${order.orderId} is already assigned to another staff`,
        );
      }
    }

    // Tạo batch code
    const batchCode = `BATCH-${new Date().toISOString().split('T')[0]}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    this.logger.log(
      `📦 Creating batch delivery ${batchCode} for ${dto.orderIds.length} orders`,
    );

    const batchLogs: ShippingLog[] = [];

    for (const order of orders) {
      // Tìm hoặc tạo shipping log
      let log = order.shippingLogs?.find(
        (l) => l.status === ShippingStatus.PENDING || !l.shippingStaffId,
      );

      if (!log) {
        // Tạo mới shipping log
        log = this.shippingLogRepository.create({
          orderId: order.orderId,
          status: ShippingStatus.PENDING,
        });
      }

      // Cập nhật batch info - CHỈ GÁN BATCH, CHƯA PICKUP
      log.shippingStaffId = dto.shippingStaffId;
      log.shippingMethod = ShippingMethod.BATCH;
      log.batchCode = batchCode;
      log.batchOrderIds = dto.orderIds;
      // GIỮ NGUYÊN STATUS PENDING - staff sẽ gọi pickupBatch() để chuyển sang IN_TRANSIT
      log.status = ShippingStatus.PENDING;
      if (dto.note) {
        log.note = `Batch ${batchCode} - ${dto.note || 'Waiting for pickup'}`;
      }

      const savedLog = await this.shippingLogRepository.save(log);
      batchLogs.push(savedLog);
    }

    this.logger.log(
      `✅ Created batch delivery ${batchCode} with ${batchLogs.length} orders (PENDING - waiting for staff pickup)`,
    );
    return batchLogs;
  }

  /**
   * 🚚 Gán thông tin GHN tracking cho order
   */
  async assignGhnOrder(dto: AssignGhnOrderDto): Promise<ShippingLog> {
    // Tìm shipping log của order
    const log = await this.shippingLogRepository.findOne({
      where: { orderId: dto.orderId },
      relations: ['order'],
    });

    if (!log) {
      throw new NotFoundException(
        `Shipping log for order ${dto.orderId} not found`,
      );
    }

    // Cập nhật GHN info
    log.shippingMethod = ShippingMethod.GHN;
    log.ghnOrderCode = dto.ghnOrderCode;
    if (dto.ghnSortCode) log.ghnSortCode = dto.ghnSortCode;
    if (dto.ghnShippingFee) log.ghnShippingFee = dto.ghnShippingFee;
    if (dto.ghnTrackingData) log.ghnTrackingData = dto.ghnTrackingData;
    log.status = ShippingStatus.PICKED_UP; // GHN đã nhận hàng
    log.carrierName = 'Giao Hàng Nhanh (GHN)';

    const savedLog = await this.shippingLogRepository.save(log);

    // Sync order status
    await this.syncOrderStatus(dto.orderId, ShippingStatus.PICKED_UP);

    this.logger.log(
      `✅ Assigned GHN order ${dto.ghnOrderCode} to order ${dto.orderId}`,
    );
    return savedLog;
  }

  /**
   * 🚚 Staff pickup batch - tất cả orders chuyển sang IN_TRANSIT
   */
  async pickupBatch(
    batchCode: string,
    staffId: string,
  ): Promise<ShippingLog[]> {
    // Tìm tất cả shipping logs trong batch
    const logs = await this.shippingLogRepository.find({
      where: { batchCode },
      relations: ['order', 'shippingStaff'],
    });

    if (logs.length === 0) {
      throw new NotFoundException(`Batch ${batchCode} not found`);
    }

    // Kiểm tra staff có quyền pickup batch này không
    const assignedStaffId = logs[0].shippingStaffId;
    if (assignedStaffId !== staffId) {
      throw new BadRequestException('You are not assigned to this batch');
    }

    // Kiểm tra batch phải ở trạng thái PENDING (chưa pickup)
    const allPending = logs.every(
      (log) => log.status === ShippingStatus.PENDING,
    );
    if (!allPending) {
      throw new BadRequestException(
        'This batch has already been picked up or some orders are not ready',
      );
    }

    this.logger.log(
      `📦 Staff ${staffId} is picking up batch ${batchCode} with ${logs.length} orders`,
    );

    // Cập nhật tất cả orders sang IN_TRANSIT
    const updatedLogs: ShippingLog[] = [];
    for (const log of logs) {
      log.status = ShippingStatus.IN_TRANSIT;
      log.note = `Batch ${batchCode} đang được vận chuyển - ${new Date().toLocaleString('vi-VN')}`;

      const savedLog = await this.shippingLogRepository.save(log);
      updatedLogs.push(savedLog);

      // Đồng bộ order status
      await this.syncOrderStatus(log.orderId, ShippingStatus.IN_TRANSIT);
    }

    this.logger.log(
      `✅ Batch ${batchCode} is now IN_TRANSIT with ${updatedLogs.length} orders`,
    );
    return updatedLogs;
  }

  /**
   * 📝 Cập nhật status của một order trong batch
   */
  async updateBatchOrder(
    batchCode: string,
    orderId: string,
    updateDto: { status: string; note?: string; finishedPictures?: string[] },
    staffId: string,
  ): Promise<ShippingLog> {
    // Tìm shipping log của order trong batch
    const log = await this.shippingLogRepository.findOne({
      where: { batchCode, orderId },
      relations: ['order', 'shippingStaff'],
    });

    if (!log) {
      throw new NotFoundException(
        `Order ${orderId} not found in batch ${batchCode}`,
      );
    }

    // Kiểm tra staff có quyền update không
    if (log.shippingStaffId !== staffId) {
      throw new BadRequestException('You are not assigned to this batch');
    }

    // Cập nhật status
    const oldStatus = log.status;
    log.status = updateDto.status as ShippingStatus;

    if (updateDto.note) {
      log.note = updateDto.note;
    }

    if (updateDto.finishedPictures) {
      log.finishedPictures = updateDto.finishedPictures;
    }

    // Nếu DELIVERED thì set deliveredDate
    if (updateDto.status === 'DELIVERED') {
      log.deliveredDate = new Date();
    }

    const savedLog = await this.shippingLogRepository.save(log);

    // Đồng bộ order status
    await this.syncOrderStatus(orderId, log.status);

    this.logger.log(
      `✅ Updated order ${orderId} in batch ${batchCode}: ${oldStatus} → ${log.status}`,
    );

    return savedLog;
  }

  /**
   * 📋 Lấy danh sách orders trong cùng 1 batch
   */
  async getOrdersByBatchCode(batchCode: string): Promise<ShippingLog[]> {
    return await this.shippingLogRepository.find({
      where: { batchCode },
      relations: [
        'order',
        'order.customer',
        'order.customer.user',
        'order.orderItems',
        'order.orderItems.product',
        'shippingStaff',
      ],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 📦 Get all batches with summary
   */
  async getAllBatches() {
    // Get all logs with batchCode
    const allLogs = await this.shippingLogRepository.find({
      where: {
        batchCode: IsNull() as any, // This will be negated below
      },
      relations: [
        'order',
        'order.customer',
        'order.customer.user',
        'order.orderItems',
        'order.orderItems.product',
        'shippingStaff',
      ],
      order: { createdAt: 'DESC' },
    });

    // Filter logs that have batchCode (TypeORM doesn't support NOT IsNull directly)
    const batchLogs = allLogs.filter((log) => log.batchCode != null);

    // Group by batchCode
    const batchesMap = new Map<string, ShippingLog[]>();
    for (const log of batchLogs) {
      if (!batchesMap.has(log.batchCode)) {
        batchesMap.set(log.batchCode, []);
      }
      batchesMap.get(log.batchCode)!.push(log);
    }

    // Transform to response format
    const batches = Array.from(batchesMap.entries()).map(
      ([batchCode, logs]) => {
        const orderCount = logs.length;
        const totalAmount = logs.reduce(
          (sum, log) => sum + Number(log.totalAmount || 0),
          0,
        );
        const completedCount = logs.filter(
          (log) => log.status === ShippingStatus.DELIVERED,
        ).length;

        // Determine batch status
        let status: string;
        if (completedCount === orderCount) {
          status = 'COMPLETED';
        } else if (completedCount > 0) {
          status = 'IN_PROGRESS';
        } else {
          status = 'PENDING';
        }

        return {
          batchCode,
          orderCount,
          totalAmount,
          status,
          completedCount,
          createdAt: logs[0]?.createdAt,
          shippingStaffId: logs[0]?.shippingStaffId,
          shippingStaff: logs[0]?.shippingStaff
            ? {
                userId: logs[0].shippingStaff.userId,
                fullName: logs[0].shippingStaff.fullName,
                phone: logs[0].shippingStaff.phone,
              }
            : null,
          orders: logs.map((log) => ({
            shippingLogId: log.shippingLogId,
            orderId: log.orderId,
            status: log.status,
            totalAmount: log.totalAmount,
            order: log.order,
          })),
        };
      },
    );

    return batches;
  }

  /**
   * 🔍 Lấy orders cùng customer để suggest batch delivery
   */
  async suggestBatchDelivery(customerId: string): Promise<Order[]> {
    const orders = await this.orderRepository.find({
      where: {
        customerId,
        status: In([OrderStatus.CONFIRMED, OrderStatus.PROCESSING]),
      },
      relations: ['shippingLogs', 'orderItems'],
    });

    // Lọc những orders chưa được assign hoặc đang pending
    return orders.filter((order) => {
      const hasActiveShipping = order.shippingLogs?.some(
        (log) =>
          log.status !== ShippingStatus.DELIVERED &&
          log.status !== ShippingStatus.RETURNED &&
          log.shippingStaffId != null,
      );
      return !hasActiveShipping;
    });
  }

  /**
   * 📦 Get batch delivery suggestions for a customer
   * Returns orders from same customer that can be batched together
   */
  async getBatchSuggestions(customerId: string): Promise<ShippingLog[]> {
    // Find all pending/confirmed shipping logs for this customer
    const logs = await this.shippingLogRepository.find({
      where: {
        order: { customerId },
        status: In([ShippingStatus.PENDING, ShippingStatus.PICKED_UP]),
        shippingMethod: In(['INTERNAL', 'BATCH']),
      },
      relations: [
        'order',
        'order.customer',
        'order.customer.user',
        'order.orderItems',
        'order.orderItems.product',
      ],
      order: { createdAt: 'ASC' },
    });

    // Filter orders that:
    // 1. Have same shipping address (or nearby)
    // 2. Not yet assigned to batch (no staff and not in batch yet)
    // 3. Created within 24 hours
    const now = new Date();
    const batchableOrders = logs.filter((log) => {
      const orderAge = now.getTime() - log.createdAt.getTime();
      const hoursOld = orderAge / (1000 * 60 * 60);
      return (
        hoursOld < 24 &&
        !log.shippingStaffId &&
        (!log.batchOrderIds || log.batchOrderIds.length === 0)
      );
    });

    this.logger.log(
      `📦 Found ${batchableOrders.length} batchable orders for customer ${customerId}`,
    );

    return batchableOrders;
  }

  /**
   * 📍 Track order shipping status for customer
   */
  async trackOrder(orderId: string, userId: string) {
    // Find shipping log for this order
    const shippingLog = await this.shippingLogRepository.findOne({
      where: { orderId },
      relations: [
        'order',
        'order.customer',
        'order.customer.user',
        'shippingStaff',
      ],
      order: { createdAt: 'DESC' },
    });

    if (!shippingLog) {
      throw new NotFoundException('Shipping log not found for this order');
    }

    // Verify customer owns this order
    if (shippingLog.order.customer?.user?.userId !== userId) {
      throw new BadRequestException('You do not have access to this order');
    }

    const result: any = {
      orderId: shippingLog.orderId,
      status: shippingLog.status,
      shippingMethod: shippingLog.shippingMethod,
      createdAt: shippingLog.createdAt,
      updatedAt: shippingLog.updatedAt,
    };

    // If GHN order, fetch real-time tracking
    if (shippingLog.ghnOrderCode && shippingLog.shippingMethod === 'GHN') {
      try {
        const ghnInfo = await this.ghnService.getOrderInfo(
          shippingLog.ghnOrderCode,
        );
        result.ghnOrderCode = shippingLog.ghnOrderCode;
        result.ghnTracking = {
          status: ghnInfo.status,
          expectedDeliveryTime: ghnInfo.expected_delivery_time,
          currentLocation: ghnInfo.current_warehouse,
          logs: ghnInfo.log || [],
        };
      } catch (error) {
        this.logger.warn(`Failed to get GHN tracking: ${error.message}`);
      }
    }

    // Add staff info if assigned
    if (shippingLog.shippingStaff) {
      result.shippingStaff = {
        staffId: shippingLog.shippingStaff.userId,
        fullName: shippingLog.shippingStaff.fullName,
        phone: shippingLog.shippingStaff.phone,
      };
    }

    return result;
  }
}
