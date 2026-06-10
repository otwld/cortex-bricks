import { Injector, runInInjectionContext } from '@angular/core';
import { Router, type CanActivateFn, type UrlTree } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { FeatureFlagsService } from '../feature-flags.service';
import { canActivateFeatureFlag } from './can-activate-feature-flag';

type FeatureFlagsServiceMock = Pick<FeatureFlagsService, 'isEnabled' | 'loadAppFlags' | 'loadUserFlags' | 'loaded'>;

type TestUrlTree = UrlTree & { url: string };

function createHarness(service: FeatureFlagsServiceMock): { injector: Injector; router: Router } {
  const router = {
    parseUrl: vi.fn((url: string) => ({ url }) as TestUrlTree),
    serializeUrl: vi.fn((tree: TestUrlTree) => tree.url),
  } as unknown as Router;
  const injector = Injector.create({
    providers: [
      { provide: FeatureFlagsService, useValue: service },
      { provide: Router, useValue: router },
    ],
  });

  return { injector, router };
}

async function runGuard(injector: Injector, guard: CanActivateFn): Promise<boolean | UrlTree> {
  return runInInjectionContext(injector, () => guard({} as never, {} as never)) as Promise<boolean | UrlTree>;
}

describe(canActivateFeatureFlag.name, () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true immediately when no features are required', async () => {
    const service: FeatureFlagsServiceMock = {
      loaded: {
        app: new BehaviorSubject(false),
        user: new BehaviorSubject(false),
      },
      isEnabled: vi.fn(),
      loadAppFlags: vi.fn(),
      loadUserFlags: vi.fn(),
    };
    const { injector } = createHarness(service);

    await expect(runGuard(injector, canActivateFeatureFlag([]))).resolves.toBe(true);
    expect(service.loadAppFlags).not.toHaveBeenCalled();
    expect(service.loadUserFlags).not.toHaveBeenCalled();
  });

  it('starts loading flags when bootstrap preloading did not run', async () => {
    const service: FeatureFlagsServiceMock = {
      loaded: {
        app: new BehaviorSubject(false),
        user: new BehaviorSubject(false),
      },
      isEnabled: vi.fn().mockReturnValue({}),
      loadAppFlags: vi.fn(async () => {
        service.loaded.app.next(true);
      }),
      loadUserFlags: vi.fn(),
    };
    const { injector } = createHarness(service);

    await expect(runGuard(injector, canActivateFeatureFlag([{ slug: 'candidate-beta', scope: 'app' }]))).resolves.toBe(true);
    expect(service.loadAppFlags).toHaveBeenCalledOnce();
  });

  it('fails closed instead of hanging when flag loading never completes', async () => {
    vi.useFakeTimers();
    const service: FeatureFlagsServiceMock = {
      loaded: {
        app: new BehaviorSubject(false),
        user: new BehaviorSubject(false),
      },
      isEnabled: vi.fn(),
      loadAppFlags: vi.fn(() => new Promise<void>(() => undefined)),
      loadUserFlags: vi.fn(),
    };
    const { injector, router } = createHarness(service);
    const resultPromise = runGuard(injector, canActivateFeatureFlag([{ slug: 'candidate-beta', scope: 'app' }], '/missing'));

    await vi.advanceTimersByTimeAsync(5_000);
    await Promise.resolve();

    const pending = Symbol('pending');
    const result = await Promise.race([resultPromise, Promise.resolve(pending)]);

    expect(result).not.toBe(pending);
    expect(router.serializeUrl(result as UrlTree)).toBe('/missing');
  });
});
