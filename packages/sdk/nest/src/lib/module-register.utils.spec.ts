import { DynamicModule, Module } from '@nestjs/common';

import {
  collectNestFeatureModuleImports,
  createNestFeatureAsyncOptionsClassProvider,
  createNestFeatureAsyncOptionsProvider,
  createNestFeatureOptionsProvider,
  createNestFeatureProvider,
  createNestFeatureValueProvider,
} from './module-register.utils';

const FEATURE_OPTIONS = Symbol('FEATURE_OPTIONS');

@Module({})
class TestModule {}

class TestOptionsFactory {
  createFeatureOptions(): { enabled: boolean } {
    return { enabled: true };
  }
}

describe('Nest feature module registration helpers', () => {
  it('creates async factory providers', async () => {
    const provider = createNestFeatureProvider(
      FEATURE_OPTIONS,
      (value: string) => ({ value }),
      ['dependency'],
    );

    expect(provider).toMatchObject({
      provide: FEATURE_OPTIONS,
      inject: ['dependency'],
    });

    expect(
      await (provider as { useFactory: (value: string) => unknown }).useFactory(
        'configured',
      ),
    ).toEqual({ value: 'configured' });
  });

  it('creates value providers', () => {
    expect(createNestFeatureValueProvider(FEATURE_OPTIONS, { enabled: true }))
      .toMatchObject({
        provide: FEATURE_OPTIONS,
        useValue: { enabled: true },
      });
  });

  it('creates options providers', () => {
    const provider = createNestFeatureOptionsProvider(FEATURE_OPTIONS, {
      useFactory: () => ({ enabled: true }),
    });

    expect(provider).toMatchObject({
      provide: FEATURE_OPTIONS,
      inject: [],
    });
  });

  it('creates class-backed async options providers', async () => {
    const provider = createNestFeatureAsyncOptionsProvider(
      FEATURE_OPTIONS,
      { useClass: TestOptionsFactory },
      'createFeatureOptions',
      (options) => ({ ...options, source: 'class' }),
    );

    expect(provider).toMatchObject({
      provide: FEATURE_OPTIONS,
      inject: [TestOptionsFactory],
    });

    expect(
      await (provider as { useFactory: (factory: TestOptionsFactory) => unknown }).useFactory(
        new TestOptionsFactory(),
      ),
    ).toEqual({ enabled: true, source: 'class' });
  });

  it('creates useClass provider registrations', () => {
    expect(
      createNestFeatureAsyncOptionsClassProvider({
        useClass: TestOptionsFactory,
      }),
    ).toEqual([
      {
        provide: TestOptionsFactory,
        useClass: TestOptionsFactory,
      },
    ]);
  });

  it('collects unique module imports in source order', () => {
    const dynamicModule: DynamicModule = {
      module: TestModule,
    };

    expect(
      collectNestFeatureModuleImports(
        [TestModule, dynamicModule],
        { imports: [dynamicModule] },
        undefined,
      ),
    ).toEqual([TestModule, dynamicModule]);
  });
});
