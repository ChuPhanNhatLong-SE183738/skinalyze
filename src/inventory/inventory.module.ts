import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { ShopInventory } from './entities/inventory.entity';
import { Product } from '../products/entities/product.entity';
import { Batch } from '../batches/entities/batch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ShopInventory, Product, Batch])],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
