import { Test, TestingModule } from '@nestjs/testing';
import { StockMovementController } from './stock-movement.controller';
import { StockMovementService } from './stock-movement.service';

describe('StockMovementController', () => {
  let controller: StockMovementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockMovementController],
      providers: [StockMovementService],
    }).compile();

    controller = module.get<StockMovementController>(StockMovementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
