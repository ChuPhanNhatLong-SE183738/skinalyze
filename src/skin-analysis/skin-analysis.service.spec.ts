import { Test, TestingModule } from '@nestjs/testing';
import { SkinAnalysisService } from './skin-analysis.service';

describe('SkinAnalysisService', () => {
  let service: SkinAnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SkinAnalysisService],
    }).compile();

    service = module.get<SkinAnalysisService>(SkinAnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
