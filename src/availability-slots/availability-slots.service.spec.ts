import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilitySlotsService } from './availability-slots.service';

describe('AvailabilitySlotsService', () => {
  let service: AvailabilitySlotsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AvailabilitySlotsService],
    }).compile();

    service = module.get<AvailabilitySlotsService>(AvailabilitySlotsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
