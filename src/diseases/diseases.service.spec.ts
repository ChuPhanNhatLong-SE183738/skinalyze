import { Test, TestingModule } from '@nestjs/testing';
import { DiseasesService } from './diseases.service';

describe('DiseasesService', () => {
  let service: DiseasesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiseasesService],
    }).compile();

    service = module.get<DiseasesService>(DiseasesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
