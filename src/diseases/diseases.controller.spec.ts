import { Test, TestingModule } from '@nestjs/testing';
import { DiseasesController } from './diseases.controller';
import { DiseasesService } from './diseases.service';

describe('DiseasesController', () => {
  let controller: DiseasesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiseasesController],
      providers: [DiseasesService],
    }).compile();

    controller = module.get<DiseasesController>(DiseasesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
