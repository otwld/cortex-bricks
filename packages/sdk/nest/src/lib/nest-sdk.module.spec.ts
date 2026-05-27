import { Test } from '@nestjs/testing';
import { NestSdkModule } from './nest-sdk.module';

describe(NestSdkModule.name, () => {
  it('compiles as a Nest module', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [NestSdkModule] }).compile();

    expect(moduleRef).toBeDefined();
  });
});
