import { Test, TestingModule } from '@nestjs/testing';
import { EscrowsController } from './escrows.controller';

describe('EscrowsController', () => {
  let controller: EscrowsController;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EscrowsController],
    }).compile();

    controller = module.get<EscrowsController>(EscrowsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
