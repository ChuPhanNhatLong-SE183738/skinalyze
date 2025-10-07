import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Batch } from './entities/batch.entity';
import { BatchItem } from './entities/batch-item.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

@Injectable()
export class BatchesService {
  constructor(
    @InjectRepository(Batch)
    private readonly batchRepository: Repository<Batch>,
    @InjectRepository(BatchItem)
    private readonly batchItemRepository: Repository<BatchItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createBatchDto: CreateBatchDto, userId: string): Promise<Batch> {
    const { batchItems, ...batchData } = createBatchDto;

    // Validate all products exist before creating batch
    await this.validateProductsExist(batchItems.map((item) => item.productId));

    // Create batch
    const batch = this.batchRepository.create({
      ...batchData,
      user: { userId } as User,
      status: 'pending',
    });
    const savedBatch = await this.batchRepository.save(batch);

    // Create batch items
    const batchItemEntities = batchItems.map((item) =>
      this.batchItemRepository.create({
        batchId: savedBatch.batchId,
        productId: item.productId,
        quantity: item.quantity,
        importPrice: item.importPrice,
        batch: item.batchNumber,
        expiryDate: new Date(item.expiryDate),
        stockRemain: item.quantity, // Initially all stock is in warehouse
      }),
    );
    await this.batchItemRepository.save(batchItemEntities);

    return this.findOne(savedBatch.batchId);
  }

  private async validateProductsExist(productIds: string[]): Promise<void> {
    const uniqueProductIds = [...new Set(productIds)];

    for (const productId of uniqueProductIds) {
      const product = await this.productRepository.findOne({
        where: { productId },
      });

      if (!product) {
        throw new BadRequestException(`Product with ID ${productId} not found`);
      }
    }
  }

  async findAll(): Promise<Batch[]> {
    return await this.batchRepository.find({
      relations: ['user', 'batchItems'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Batch> {
    const batch = await this.batchRepository.findOne({
      where: { batchId: id },
      relations: ['user', 'batchItems'],
    });
    if (!batch) {
      throw new NotFoundException(`Batch with ID ${id} not found`);
    }
    return batch;
  }

  async update(id: string, updateBatchDto: UpdateBatchDto): Promise<Batch> {
    const batch = await this.findOne(id);
    Object.assign(batch, updateBatchDto);
    await this.batchRepository.save(batch);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const batch = await this.findOne(id);
    await this.batchRepository.remove(batch);
  }

  async approveBatch(id: string): Promise<Batch> {
    const batch = await this.findOne(id);

    if (batch.status === 'approved') {
      throw new BadRequestException('Batch is already approved');
    }

    batch.status = 'approved';
    await this.batchRepository.save(batch);
    return batch;
  }

  async rejectBatch(id: string, reason: string): Promise<Batch> {
    const batch = await this.findOne(id);

    if (batch.status === 'approved') {
      throw new BadRequestException('Cannot reject an approved batch');
    }

    batch.status = 'rejected';
    batch.reason = reason;
    await this.batchRepository.save(batch);
    return batch;
  }

  async findByUser(userId: string): Promise<Batch[]> {
    return await this.batchRepository.find({
      where: { user: { userId } },
      relations: ['batchItems'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByStatus(status: string): Promise<Batch[]> {
    return await this.batchRepository.find({
      where: { status },
      relations: ['user', 'batchItems'],
      order: { createdAt: 'DESC' },
    });
  }

  async getStockHistory(productId: string): Promise<BatchItem[]> {
    return await this.batchItemRepository.find({
      where: { productId },
      relations: ['batchRelation'],
      order: { createdAt: 'DESC' },
    });
  }

  async getBatchItem(batchId: string, productId: string): Promise<BatchItem> {
    const batchItem = await this.batchItemRepository.findOne({
      where: { batchId, productId },
    });

    if (!batchItem) {
      throw new NotFoundException(
        `Batch item not found for batch ${batchId} and product ${productId}`,
      );
    }

    return batchItem;
  }

  async getBatchItems(batchId: string): Promise<BatchItem[]> {
    return await this.batchItemRepository.find({
      where: { batchId },
      order: { productId: 'ASC' },
    });
  }

  async getAvailableStockForDistribution(
    batchId: string,
    productId: string,
  ): Promise<number> {
    const batchItem = await this.batchItemRepository.findOne({
      where: { batchId, productId },
    });

    return batchItem?.stockRemain || 0;
  }

  async updateStockRemain(
    batchId: string,
    productId: string,
    quantity: number,
  ): Promise<void> {
    const batchItem = await this.getBatchItem(batchId, productId);

    if (batchItem.stockRemain < quantity) {
      throw new BadRequestException(
        `Insufficient stock in batch skibidi. Available: ${batchItem.stockRemain}, Requested: ${quantity}`,
      );
    }

    batchItem.stockRemain -= quantity;
    await this.batchItemRepository.save(batchItem);
  }
}
