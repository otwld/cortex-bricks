import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, firstValueFrom, of, timeout } from 'rxjs';

import { FeatureFlagsService } from '../feature-flags.service';
import type { FeatureFlagScope } from '../feature-flags.types';

/** Feature slug and scope that must be enabled before a route can activate. */
export type FeatureFlagRouteRequirement = { slug: string; scope: FeatureFlagScope };

const FEATURE_FLAG_GUARD_LOAD_TIMEOUT_MS = 5_000;

/**
 * Route guard that blocks navigation unless all required features are enabled.
 */
export const canActivateFeatureFlag =
  (requirements: FeatureFlagRouteRequirement[], fallbackUrl?: string): CanActivateFn =>
  async () => {
    if (!requirements.length) return true;

    const flags = inject(FeatureFlagsService);
    const router = inject(Router);
    const needsUser = requirements.some((feature) => feature.scope === 'user');

    const appLoaded = await ensureFeatureFlagScopeLoaded(flags, 'app');
    const userLoaded = needsUser ? await ensureFeatureFlagScopeLoaded(flags, 'user') : true;
    if (!appLoaded || !userLoaded) {
      return router.parseUrl(fallbackUrl ?? '/');
    }

    const ok = requirements.every((feature) => flags.isEnabled(feature.slug, feature.scope));

    if (ok) return true;
    return router.parseUrl(fallbackUrl ?? '/');
  };

function ensureFeatureFlagScopeLoaded(
  flags: FeatureFlagsService,
  scope: FeatureFlagScope,
): Promise<boolean> {
  const loaded = flags.loaded[scope];
  if (loaded.getValue()) return Promise.resolve(true);

  const waitForLoaded = firstValueFrom(
    loaded.pipe(
      filter((value): value is true => value),
      timeout({ first: FEATURE_FLAG_GUARD_LOAD_TIMEOUT_MS, with: () => of(false) }),
    ),
  );
  const load = scope === 'app' ? flags.loadAppFlags() : flags.loadUserFlags();
  void load.catch(() => undefined);

  return waitForLoaded;
}
