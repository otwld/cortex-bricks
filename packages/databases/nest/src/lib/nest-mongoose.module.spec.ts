import { Test } from '@nestjs/testing';
import { NestMongooseModule } from './nest-mongoose.module';

describe(NestMongooseModule.name, () => {
  it('compiles as a Nest module', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [NestMongooseModule] }).compile();

    expect(moduleRef).toBeDefined();
  });
});
