import { Test, TestingModule } from '@nestjs/testing';
import { StockMovementService } from './stock-movement.service';

describe('StockMovementService', () => {
  let service: StockMovementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StockMovementService],
    }).compile();

    service = module.get<StockMovementService>(StockMovementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
