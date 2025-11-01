import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilitySlotsController } from './availability-slots.controller';

describe('AvailabilitySlotsController', () => {
  let controller: AvailabilitySlotsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AvailabilitySlotsController],
    }).compile();

    controller = module.get<AvailabilitySlotsController>(
      AvailabilitySlotsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
