import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ShippingLog } from './entities/shipping-log.entity';
import { CreateShippingLogDto } from './dto/create-shipping-log.dto';
import { UpdateShippingLogDto } from './dto/update-shipping-log.dto';
import { ShippingStatus } from './entities/shipping-log.entity';

@Injectable()
export class ShippingLogsService {
  constructor(
    @InjectRepository(ShippingLog)
    private readonly shippingLogRepository: Repository<ShippingLog>,
  ) {}

  async create(createDto: CreateShippingLogDto): Promise<ShippingLog> {
    const log = this.shippingLogRepository.create(createDto);
    return await this.shippingLogRepository.save(log);
  }

  async findAll(): Promise<ShippingLog[]> {
    return await this.shippingLogRepository.find({
      relations: ['order', 'order.customer', 'order.customer.user', 'shippingStaff'],
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
      relations: ['order', 'order.customer', 'order.customer.user'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 👤 Lấy danh sách đơn hàng của một staff cụ thể
   */
  async findByStaffId(staffId: string): Promise<ShippingLog[]> {
    return await this.shippingLogRepository.find({
      where: { shippingStaffId: staffId },
      relations: ['order', 'order.customer', 'order.customer.user', 'shippingStaff'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ShippingLog> {
    const log = await this.shippingLogRepository.findOne({
      where: { shippingLogId: id },
      relations: ['order', 'order.customer', 'order.customer.user', 'shippingStaff'],
    });

    if (!log) {
      throw new NotFoundException(`Shipping log with ID ${id} not found`);
    }

    return log;
  }

  async findByOrderId(orderId: string): Promise<ShippingLog[]> {
    return await this.shippingLogRepository.find({
      where: { orderId },
      relations: ['order', 'order.customer', 'order.customer.user', 'shippingStaff'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 🤝 Staff tự nhận đơn hàng (self-assign)
   */
  async assignToMe(shippingLogId: string, staffId: string): Promise<ShippingLog> {
    const log = await this.findOne(shippingLogId);

    // Kiểm tra đơn hàng đã có staff chưa
    if (log.shippingStaffId) {
      throw new BadRequestException(
        `Đơn hàng này đã được nhận bởi staff khác`,
      );
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

    return await this.shippingLogRepository.save(log);
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

    return await this.shippingLogRepository.save(log);
  }

  async update(
    id: string,
    updateDto: UpdateShippingLogDto,
  ): Promise<ShippingLog> {
    const log = await this.findOne(id);
    Object.assign(log, updateDto);
    return await this.shippingLogRepository.save(log);
  }

  async remove(id: string): Promise<void> {
    const log = await this.findOne(id);
    await this.shippingLogRepository.remove(log);
  }
}
