import { Test, TestingModule } from '@nestjs/testing';
import { DiseaseGroupsService } from './disease-groups.service';

describe('DiseaseGroupsService', () => {
  let service: DiseaseGroupsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiseaseGroupsService],
    }).compile();

    service = module.get<DiseaseGroupsService>(DiseaseGroupsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
