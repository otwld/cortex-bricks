import { inject, makeEnvironmentProviders, provideAppInitializer } from '@angular/core';

import { FeatureFlagsService } from './feature-flags.service';

/**
 * Registers the feature flags service and preloads app/user flags at bootstrap.
 * Call this in your root bootstrap providers.
 *
 * @example
 *   bootstrapApplication(AppComponent, {
 *     providers: [
 *       provideHttpClient(),
 *       provideRouter(routes),
 *       provideFeatureFlags()
 *     ]
 *   });
 */
export function provideFeatureFlags() {
  return makeEnvironmentProviders([
    FeatureFlagsService,
    provideAppInitializer(() => {
      const service = inject(FeatureFlagsService);
      void service.loadUserFlags().catch(() => undefined);
      return service.loadAppFlags().catch(() => undefined);
    }),
  ]);
}
