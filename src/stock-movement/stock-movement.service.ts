import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  StockMovement,
  MovementType,
  MovementStatus,
} from './entities/stock-movement.entity';
import { StockMovementItem } from './entities/stock-movement-item.entity';
import { ShopInventory } from '../inventory/entities/inventory.entity';
import { BatchItem } from '../batches/entities/batch-item.entity';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StockMovementService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
    @InjectRepository(StockMovementItem)
    private readonly stockMovementItemRepository: Repository<StockMovementItem>,
    @InjectRepository(ShopInventory)
    private readonly shopInventoryRepository: Repository<ShopInventory>,
    @InjectRepository(BatchItem)
    private readonly batchItemRepository: Repository<BatchItem>,
  ) {}

  async createMovement(
    createDto: CreateStockMovementDto,
    userId: string,
  ): Promise<StockMovement> {
    // Validate movement
    await this.validateMovement(createDto);

    // Create movement
    const movement = this.stockMovementRepository.create({
      movementId: uuidv4(),
      movementType: createDto.movementType,
      sourceShopId: createDto.fromShopId,
      address: createDto.address,
      destinationShopId: createDto.toShopId,
      batchId: createDto.items[0]?.batchId, // For IMPORT type reference
      reason: createDto.reason,
      requestedBy: userId,
      status: MovementStatus.PENDING,
    });
    const savedMovement = await this.stockMovementRepository.save(movement);

    // Create movement items
    const movementItems = createDto.items.map((item) =>
      this.stockMovementItemRepository.create({
        stockMovementItemId: uuidv4(),
        movementId: savedMovement.movementId,
        productId: item.productId,
        batchId: item.batchId,
        quantity: item.quantity,
      }),
    );
    await this.stockMovementItemRepository.save(movementItems);

    return this.findOne(savedMovement.movementId);
  }

  async approveMovement(
    movementId: string,
    approverId: string,
  ): Promise<StockMovement> {
    const movement = await this.findOne(movementId);

    if (movement.status !== MovementStatus.PENDING) {
      throw new BadRequestException('Movement is not in pending status');
    }

    if (!movement.address) {
      throw new BadRequestException('Address is required to approve movement');
    }

    // Execute the actual stock movement
    await this.executeStockMovement(movement);

    movement.status = MovementStatus.APPROVED;
    movement.approvedBy = approverId;
    movement.approvedAt = new Date();

    return await this.stockMovementRepository.save(movement);
  }

  async rejectMovement(
    movementId: string,
    approverId: string,
    reason: string,
  ): Promise<StockMovement> {
    const movement = await this.findOne(movementId);

    if (movement.status !== MovementStatus.PENDING) {
      throw new BadRequestException('Movement is not in pending status');
    }

    movement.status = MovementStatus.REJECTED;
    movement.approvedBy = approverId;
    movement.rejectionReason = reason;
    movement.approvedAt = new Date();

    return await this.stockMovementRepository.save(movement);
  }

  async findAll(filters?: {
    movementType?: MovementType;
    status?: MovementStatus;
    shopId?: string;
  }): Promise<StockMovement[]> {
    const query = this.stockMovementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.items', 'items')
      .orderBy('movement.createdAt', 'DESC');

    if (filters?.movementType) {
      query.andWhere('movement.movementType = :movementType', {
        movementType: filters.movementType,
      });
    }

    if (filters?.status) {
      query.andWhere('movement.status = :status', { status: filters.status });
    }

    if (filters?.shopId) {
      query.andWhere(
        '(movement.sourceShopId = :shopId OR movement.destinationShopId = :shopId)',
        { shopId: filters.shopId },
      );
    }

    return await query.getMany();
  }

  async findOne(id: string): Promise<StockMovement> {
    const movement = await this.stockMovementRepository.findOne({
      where: { movementId: id },
      relations: ['items'],
    });

    if (!movement) {
      throw new NotFoundException(`Stock movement with ID ${id} not found`);
    }

    return movement;
  }

  async getMovementHistory(
    productId?: string,
    batchId?: string,
    shopId?: string,
  ): Promise<StockMovement[]> {
    const query = this.stockMovementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.items', 'items')
      .orderBy('movement.createdAt', 'DESC');

    if (productId) {
      query.andWhere('items.productId = :productId', { productId });
    }

    if (batchId) {
      query.andWhere('items.batchId = :batchId', { batchId });
    }

    if (shopId) {
      query.andWhere(
        '(movement.sourceShopId = :shopId OR movement.destinationShopId = :shopId)',
        { shopId },
      );
    }

    return await query.getMany();
  }

  private async validateMovement(
    createDto: CreateStockMovementDto,
  ): Promise<void> {
    // Validate items exist
    if (!createDto.items || createDto.items.length === 0) {
      throw new BadRequestException('At least one item is required');
    }

    // Validate movement type specific rules
    switch (createDto.movementType) {
      case MovementType.IMPORT:
        if (!createDto.toShopId) {
          throw new BadRequestException('Destination shop required for import');
        }
        if (createDto.fromShopId) {
          throw new BadRequestException(
            'Source shop should not be specified for import',
          );
        }
        break;

      case MovementType.TRANSFER:
        if (!createDto.fromShopId || !createDto.toShopId) {
          throw new BadRequestException(
            'Both source and destination shops required for transfer',
          );
        }
        if (createDto.fromShopId === createDto.toShopId) {
          throw new BadRequestException(
            'Source and destination shops cannot be the same',
          );
        }
        break;

      case MovementType.EXPORT:
        if (!createDto.fromShopId) {
          throw new BadRequestException('Source shop required for export');
        }
        if (createDto.toShopId) {
          throw new BadRequestException(
            'Destination shop should not be specified for export',
          );
        }
        break;
    }

    // Validate all batches exist and have stock
    for (const item of createDto.items) {
      if (createDto.movementType === MovementType.IMPORT) {
        const batchItem = await this.batchItemRepository.findOne({
          where: { batchId: item.batchId, productId: item.productId },
        });

        if (!batchItem) {
          throw new NotFoundException(
            `Batch item not found for product ${item.productId} in batch ${item.batchId}`,
          );
        }

        if (batchItem.stockRemain < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock in batch for product ${item.productId}. Available: ${batchItem.stockRemain}, Requested: ${item.quantity}`,
          );
        }
      }

      // Validate source inventory for TRANSFER/EXPORT
      if (
        createDto.movementType === MovementType.TRANSFER ||
        createDto.movementType === MovementType.EXPORT
      ) {
        const inventory = await this.shopInventoryRepository.findOne({
          where: {
            shopId: createDto.fromShopId,
            productId: item.productId,
            batchId: item.batchId,
          },
        });

        if (!inventory || inventory.currentStock < item.quantity) {
          throw new BadRequestException(
            `Insufficient inventory for product ${item.productId} in shop ${createDto.fromShopId}`,
          );
        }
      }
    }
  }

  private async executeStockMovement(movement: StockMovement): Promise<void> {
    switch (movement.movementType) {
      case MovementType.IMPORT:
        await this.executeImport(movement);
        break;
      case MovementType.TRANSFER:
        await this.executeTransfer(movement);
        break;
      case MovementType.EXPORT:
        await this.executeExport(movement);
        break;
    }
  }

  private async executeImport(movement: StockMovement): Promise<void> {
    const items = await this.stockMovementItemRepository.find({
      where: { movementId: movement.movementId },
    });

    for (const item of items) {
      // Update batch stockRemain
      const batchItem = await this.batchItemRepository.findOne({
        where: {
          batchId: item.batchId,
          productId: item.productId,
        },
      });

      if (!batchItem) {
        throw new NotFoundException('Batch item not found');
      }

      if (batchItem.stockRemain < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock in batch skibidi2. Available: ${batchItem.stockRemain}, Requested: ${item.quantity}`,
        );
      }

      batchItem.stockRemain -= item.quantity;
      await this.batchItemRepository.save(batchItem);

      // Add to shop inventory
      await this.addInventory(
        movement.destinationShopId,
        item.productId,
        item.batchId,
        item.quantity,
        movement.address,
      );
    }
  }

  private async executeTransfer(movement: StockMovement): Promise<void> {
    const items = await this.stockMovementItemRepository.find({
      where: { movementId: movement.movementId },
    });

    for (const item of items) {
      // Validate source has stock
      const sourceInventory = await this.shopInventoryRepository.findOne({
        where: {
          shopId: movement.sourceShopId,
          productId: item.productId,
          batchId: item.batchId,
        },
      });

      if (!sourceInventory || sourceInventory.currentStock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock in source shop for product ${item.productId}`,
        );
      }

      // Remove from source
      await this.removeInventory(
        movement.sourceShopId,
        item.productId,
        item.batchId,
        item.quantity,
      );

      // Add to destination
      await this.addInventory(
        movement.destinationShopId,
        item.productId,
        item.batchId,
        item.quantity,
        movement.address,
      );
    }
  }

  private async executeExport(movement: StockMovement): Promise<void> {
    const items = await this.stockMovementItemRepository.find({
      where: { movementId: movement.movementId },
    });

    for (const item of items) {
      await this.removeInventory(
        movement.sourceShopId,
        item.productId,
        item.batchId,
        item.quantity,
      );
    }
  }

  private async addInventory(
    shopId: string,
    productId: string,
    batchId: string,
    quantity: number,
    address?: string,
  ): Promise<void> {
    const existingInventory = await this.shopInventoryRepository.findOne({
      where: { shopId, productId, batchId },
    });

    if (existingInventory) {
      existingInventory.currentStock += quantity;
      await this.shopInventoryRepository.save(existingInventory);
    } else {
      // Get address from existing inventory of the same shop if not provided
      if (!address) {
        const sampleInventory = await this.shopInventoryRepository.findOne({
          where: { shopId },
        });
        address = sampleInventory?.address || 'Unknown Address';
      }

      const newInventory = this.shopInventoryRepository.create({
        inventoryId: uuidv4(),
        shopId,
        productId,
        batchId,
        address,
        currentStock: quantity,
        reservedStock: 0,
      });
      await this.shopInventoryRepository.save(newInventory);
    }
  }

  private async removeInventory(
    shopId: string,
    productId: string,
    batchId: string,
    quantity: number,
  ): Promise<void> {
    const inventory = await this.shopInventoryRepository.findOne({
      where: { shopId, productId, batchId },
    });

    if (!inventory) {
      throw new BadRequestException('Inventory not found for removal');
    }

    if (inventory.currentStock < quantity) {
      throw new BadRequestException('Insufficient stock for removal');
    }

    inventory.currentStock -= quantity;

    // Remove inventory record if empty
    if (inventory.currentStock === 0 && inventory.reservedStock === 0) {
      await this.shopInventoryRepository.remove(inventory);
    } else {
      await this.shopInventoryRepository.save(inventory);
    }
  }
}
