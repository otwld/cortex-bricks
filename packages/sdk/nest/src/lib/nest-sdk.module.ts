import { Module } from '@nestjs/common';

/** Empty Nest SDK module reserved for shared backend SDK providers. */
@Module({
  controllers: [],
  providers: [],
  exports: [],
})
export class NestSdkModule {}
