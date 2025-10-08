import { Test, TestingModule } from '@nestjs/testing';
import { SkinAnalysisController } from './skin-analysis.controller';
import { SkinAnalysisService } from './skin-analysis.service';

describe('SkinAnalysisController', () => {
  let controller: SkinAnalysisController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SkinAnalysisController],
      providers: [SkinAnalysisService],
    }).compile();

    controller = module.get<SkinAnalysisController>(SkinAnalysisController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
