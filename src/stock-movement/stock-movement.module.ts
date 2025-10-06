import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockMovementService } from './stock-movement.service';
import { StockMovementController } from './stock-movement.controller';
import { StockMovement } from './entities/stock-movement.entity';
import { ShopInventory } from '../inventory/entities/inventory.entity';
import { BatchItem } from '../batches/entities/batch-item.entity';
import { StockMovementItem } from './entities/stock-movement-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StockMovement,
      ShopInventory,
      BatchItem,
      StockMovementItem,
    ]),
  ],
  controllers: [StockMovementController],
  providers: [StockMovementService],
  exports: [StockMovementService],
})
export class StockMovementModule {}
