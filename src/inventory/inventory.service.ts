import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShopInventory } from './entities/inventory.entity';
import { Batch } from '../batches/entities/batch.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(ShopInventory)
    private readonly inventoryRepository: Repository<ShopInventory>,
  ) {}

  async getShopInventory(shopId: string): Promise<ShopInventory[]> {
    return await this.inventoryRepository.find({
      where: { shopId },
      relations: ['batch'],
      order: { updatedAt: 'DESC' },
    });
  }

  async getProductInventoryAcrossShops(
    productId: string,
  ): Promise<ShopInventory[]> {
    return await this.inventoryRepository.find({
      where: { productId },
      relations: ['batch'],
      order: { shopId: 'ASC', updatedAt: 'DESC' },
    });
  }

  async getBatchInventoryAcrossShops(
    batchId: string,
  ): Promise<ShopInventory[]> {
    return await this.inventoryRepository.find({
      where: { batchId },
      relations: ['batch'],
      order: { shopId: 'ASC', updatedAt: 'DESC' },
    });
  }

  async getProductBatches(
    shopId: string,
    productId: string,
  ): Promise<ShopInventory[]> {
    return await this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.batch', 'batch')
      .leftJoin(
        'batch_items',
        'batchItem',
        'batchItem.batchId = inventory.batchId AND batchItem.productId = inventory.productId',
      )
      .where('inventory.shopId = :shopId', { shopId })
      .andWhere('inventory.productId = :productId', { productId })
      .andWhere('inventory.currentStock > 0')
      .orderBy('batchItem.expiryDate', 'ASC') // FIFO
      .getMany();
  }

  async getAvailableStock(
    shopId: string,
    productId: string,
    batchId?: string,
  ): Promise<number> {
    const query = this.inventoryRepository
      .createQueryBuilder('inventory')
      .select(
        'SUM(inventory.currentStock - inventory.reservedStock)',
        'available',
      )
      .where('inventory.shopId = :shopId', { shopId })
      .andWhere('inventory.productId = :productId', { productId });

    if (batchId) {
      query.andWhere('inventory.batchId = :batchId', { batchId });
    }

    const result = await query.getRawOne();
    return parseInt(result?.available || '0');
  }

  async adjustStockByBatch(
    shopId: string,
    productId: string,
    batchId: string,
    quantity: number,
  ): Promise<void> {
    let inventory = await this.inventoryRepository.findOne({
      where: { shopId, productId, batchId },
    });

    if (!inventory) {
      if (quantity < 0) {
        throw new BadRequestException('Cannot reduce non-existent inventory');
      }

      // Create new inventory record
      inventory = this.inventoryRepository.create({
        inventoryId: `INV-${Date.now()}-${Math.random()}`,
        shopId,
        productId,
        batchId,
        currentStock: quantity,
        reservedStock: 0,
      });
    } else {
      inventory.currentStock += quantity;

      if (inventory.currentStock < 0) {
        throw new BadRequestException('Cannot reduce stock below zero');
      }

      // Remove record if stock reaches 0
      if (inventory.currentStock === 0 && inventory.reservedStock === 0) {
        await this.inventoryRepository.remove(inventory);
        return;
      }
    }

    await this.inventoryRepository.save(inventory);
  }

  async reserveStock(
    shopId: string,
    productId: string,
    quantity: number,
  ): Promise<{
    success: boolean;
    reservations: { batchId: string; quantity: number; expiryDate?: Date }[];
  }> {
    // FEFO: First Expire First Out - Lấy batch gần hết hạn trước
    const inventories = await this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.batch', 'batch')
      .leftJoin(
        'batch_items',
        'batchItem',
        'batchItem.batchId = inventory.batchId AND batchItem.productId = inventory.productId',
      )
      .where('inventory.shopId = :shopId', { shopId })
      .andWhere('inventory.productId = :productId', { productId })
      .andWhere('inventory.currentStock > inventory.reservedStock')
      .orderBy('batchItem.expiryDate', 'ASC')
      .getMany();

    // Calculate total available
    const totalAvailable = inventories.reduce(
      (sum, inv) => sum + (inv.currentStock - inv.reservedStock),
      0,
    );

    if (totalAvailable < quantity) {
      return {
        success: false,
        reservations: [],
      };
    }

    const reservations: {
      batchId: string;
      quantity: number;
      expiryDate?: Date;
    }[] = [];
    let remainingQuantity = quantity;

    // Reserve từ batches (gần hết hạn trước)
    for (const inventory of inventories) {
      if (remainingQuantity <= 0) break;

      const availableInBatch = inventory.currentStock - inventory.reservedStock;
      const toReserve = Math.min(remainingQuantity, availableInBatch);

      if (toReserve > 0) {
        inventory.reservedStock += toReserve;
        await this.inventoryRepository.save(inventory);

        // Get expiry date from batch_items
        const batchItem = await this.getBatchItemInfo(
          inventory.batchId,
          inventory.productId,
        );

        reservations.push({
          batchId: inventory.batchId,
          quantity: toReserve,
          expiryDate: batchItem?.expiryDate,
        });

        remainingQuantity -= toReserve;
      }
    }

    return { success: true, reservations };
  }

  // Helper method to get batch item details
  private async getBatchItemInfo(
    batchId: string,
    productId: string,
  ): Promise<{ expiryDate: Date; importPrice: number } | null> {
    const result = await this.inventoryRepository.manager.query(
      `SELECT expiryDate, importPrice 
     FROM batch_items 
     WHERE batchId = ? AND productId = ?`,
      [batchId, productId],
    );

    return result[0] || null;
  }

  async releaseReservation(
    shopId: string,
    productId: string,
    batchId: string,
    quantity: number,
  ): Promise<void> {
    const inventory = await this.inventoryRepository.findOne({
      where: { shopId, productId, batchId },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    if (inventory.reservedStock < quantity) {
      throw new BadRequestException('Cannot release more than reserved');
    }

    inventory.reservedStock -= quantity;
    await this.inventoryRepository.save(inventory);
  }

  async confirmSale(
    shopId: string,
    productId: string,
    batchId: string,
    quantity: number,
  ): Promise<void> {
    const inventory = await this.inventoryRepository.findOne({
      where: { shopId, productId, batchId },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    if (inventory.reservedStock < quantity) {
      throw new BadRequestException(
        'Cannot confirm sale for more than reserved',
      );
    }

    inventory.currentStock -= quantity;
    inventory.reservedStock -= quantity;
    await this.inventoryRepository.save(inventory);
  }

  async confirmMultipleSales(
    shopId: string,
    sales: Array<{ productId: string; batchId: string; quantity: number }>,
  ): Promise<void> {
    for (const sale of sales) {
      await this.confirmSale(
        shopId,
        sale.productId,
        sale.batchId,
        sale.quantity,
      );
    }
  }

  async getLowStockAlerts(
    shopId?: string,
    threshold: number = 10,
  ): Promise<ShopInventory[]> {
    const query = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.batch', 'batch')
      .where(
        '(inventory.currentStock - inventory.reservedStock) <= :threshold',
        { threshold },
      );

    if (shopId) {
      query.andWhere('inventory.shopId = :shopId', { shopId });
    }

    return await query.getMany();
  }

  async getExpiringBatches(
    shopId?: string,
    daysFromNow: number = 30,
  ): Promise<ShopInventory[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysFromNow);

    const query = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.batch', 'batch')
      .leftJoin(
        'batch_items',
        'batchItem',
        'batchItem.batchId = inventory.batchId',
      )
      .where('batchItem.expiryDate <= :futureDate', { futureDate })
      .andWhere('inventory.currentStock > 0');

    if (shopId) {
      query.andWhere('inventory.shopId = :shopId', { shopId });
    }

    return await query.orderBy('batchItem.expiryDate', 'ASC').getMany();
  }

  async getInventorySummary(shopId?: string): Promise<any> {
    const query = this.inventoryRepository
      .createQueryBuilder('inventory')
      .select([
        'COUNT(DISTINCT inventory.productId) as totalProducts',
        'SUM(inventory.currentStock) as totalStock',
        'SUM(inventory.reservedStock) as totalReserved',
        'SUM(inventory.currentStock - inventory.reservedStock) as availableStock',
      ]);

    if (shopId) {
      query.where('inventory.shopId = :shopId', { shopId });
    }

    return await query.getRawOne();
  }

  /**
   * Tìm tất cả shops có sản phẩm này + đủ số lượng available
   * @param productId Product ID
   * @param quantity Số lượng cần
   * @returns Danh sách shops có đủ hàng
   */
  async findAvailableShops(
    productId: string,
    quantity: number,
  ): Promise<{ shopId: string; availableStock: number }[]> {
    const results = await this.inventoryRepository
      .createQueryBuilder('inventory')
      .select('inventory.shopId', 'shopId')
      .addSelect(
        'SUM(inventory.currentStock - inventory.reservedStock)',
        'availableStock',
      )
      .where('inventory.productId = :productId', { productId })
      .andWhere('(inventory.currentStock - inventory.reservedStock) > 0')
      .groupBy('inventory.shopId')
      .having(
        'SUM(inventory.currentStock - inventory.reservedStock) >= :quantity',
        {
          quantity,
        },
      )
      .getRawMany();

    return results;
  }

  /**
   * 🔥 Tìm tất cả INVENTORY (kho) có sản phẩm này + đủ số lượng available
   * @param productId Product ID
   * @param quantity Số lượng cần
   * @returns Danh sách inventory records có đủ hàng (có address)
   */
  async findAvailableInventories(
    productId: string,
    quantity: number,
  ): Promise<ShopInventory[]> {
    // Query inventory có available stock >= quantity
    const inventories = await this.inventoryRepository
      .createQueryBuilder('inventory')
      .where('inventory.productId = :productId', { productId })
      .andWhere(
        '(inventory.currentStock - inventory.reservedStock) >= :quantity',
        {
          quantity,
        },
      )
      .getMany();

    return inventories;
  }
}
