import { Test, TestingModule } from '@nestjs/testing';
import { DiseaseGroupsController } from './disease-groups.controller';
import { DiseaseGroupsService } from './disease-groups.service';

describe('DiseaseGroupsController', () => {
  let controller: DiseaseGroupsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiseaseGroupsController],
      providers: [DiseaseGroupsService],
    }).compile();

    controller = module.get<DiseaseGroupsController>(DiseaseGroupsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
