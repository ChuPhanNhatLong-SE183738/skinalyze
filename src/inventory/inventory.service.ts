import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './entities/inventory.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
  ) {}

  // Get all inventory
  async getAllInventory(): Promise<Inventory[]> {
    return await this.inventoryRepository.find({
      relations: ['product'],
      order: { updatedAt: 'DESC' },
    });
  }

  // Get inventory for a specific product
  async getProductInventory(productId: string): Promise<Inventory | null> {
    return await this.inventoryRepository.findOne({
      where: { productId },
      relations: ['product'],
    });
  }

  // Get available stock for a product
  async getAvailableStock(productId: string): Promise<number> {
    const inventory = await this.inventoryRepository.findOne({
      where: { productId },
    });

    if (!inventory) {
      return 0;
    }

    return Math.max(0, inventory.currentStock - inventory.reservedStock);
  }

  // Adjust stock (+ or -)
  async adjustStock(productId: string, quantity: number): Promise<void> {
    let inventory = await this.inventoryRepository.findOne({
      where: { productId },
    });

    if (!inventory) {
      if (quantity < 0) {
        throw new BadRequestException('Cannot reduce non-existent inventory');
      }

      // Create new inventory record
      inventory = this.inventoryRepository.create({
        productId,
        originalPrice: 0,
        currentStock: quantity,
        reservedStock: 0,
      });
    } else {
      inventory.currentStock += quantity;

      if (inventory.currentStock < 0) {
        throw new BadRequestException('Cannot reduce stock below zero');
      }
    }

    await this.inventoryRepository.save(inventory);
  }

  // Set absolute stock level
  async setStock(
    productId: string,
    quantity: number,
    originalPrice?: number,
  ): Promise<void> {
    let inventory = await this.inventoryRepository.findOne({
      where: { productId },
    });

    if (!inventory) {
      inventory = this.inventoryRepository.create({
        productId,
        originalPrice: originalPrice || 0,
        currentStock: quantity,
        reservedStock: 0,
      });
    } else {
      inventory.currentStock = quantity;
      if (originalPrice !== undefined) {
        inventory.originalPrice = originalPrice;
      }
    }

    await this.inventoryRepository.save(inventory);
  }

  // Reserve stock (simple version - no batch tracking)
  async reserveStock(
    productId: string,
    quantity: number,
  ): Promise<{ success: boolean }> {
    const inventory = await this.inventoryRepository.findOne({
      where: { productId },
    });

    if (!inventory) {
      return { success: false };
    }

    const available = inventory.currentStock - inventory.reservedStock;

    if (available < quantity) {
      return { success: false };
    }

    inventory.reservedStock += quantity;
    await this.inventoryRepository.save(inventory);

    return { success: true };
  }

  // Release reservation
  async releaseReservation(productId: string, quantity: number): Promise<void> {
    const inventory = await this.inventoryRepository.findOne({
      where: { productId },
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

  // Confirm sale (reduce both current and reserved)
  async confirmSale(productId: string, quantity: number): Promise<void> {
    const inventory = await this.inventoryRepository.findOne({
      where: { productId },
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

  // Confirm multiple sales
  async confirmMultipleSales(
    sales: Array<{ productId: string; quantity: number }>,
  ): Promise<void> {
    for (const sale of sales) {
      await this.confirmSale(sale.productId, sale.quantity);
    }
  }

  // Low stock alerts
  async getLowStockAlerts(threshold: number = 10): Promise<Inventory[]> {
    return await this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product')
      .where(
        '(inventory.currentStock - inventory.reservedStock) <= :threshold',
        { threshold },
      )
      .andWhere('(inventory.currentStock - inventory.reservedStock) >= 0')
      .orderBy('inventory.currentStock - inventory.reservedStock', 'ASC')
      .getMany();
  }

  // Inventory summary stats
  async getInventorySummary(): Promise<{
    totalProducts: number;
    totalStock: number;
    totalReserved: number;
    availableStock: number;
  }> {
    const result = await this.inventoryRepository
      .createQueryBuilder('inventory')
      .select([
        'COUNT(inventory.productId) as totalProducts',
        'SUM(inventory.currentStock) as totalStock',
        'SUM(inventory.reservedStock) as totalReserved',
        'SUM(inventory.currentStock - inventory.reservedStock) as availableStock',
      ])
      .getRawOne();

    return {
      totalProducts: parseInt(result?.totalProducts || '0'),
      totalStock: parseInt(result?.totalStock || '0'),
      totalReserved: parseInt(result?.totalReserved || '0'),
      availableStock: parseInt(result?.availableStock || '0'),
    };
  }
}
