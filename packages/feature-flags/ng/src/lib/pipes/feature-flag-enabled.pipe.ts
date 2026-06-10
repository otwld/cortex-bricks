import { Pipe, PipeTransform, inject } from '@angular/core';

import { FeatureFlagsService } from '../feature-flags.service';
import type { FeatureFlagScope } from '../feature-flags.types';

/**
 * Impure pipe to check a feature in templates.
 * Usage:
 *   @if ('job-offer-visibility' | featureFlagEnabled : 'app') { <button>Open offers</button> }
 */
@Pipe({ name: 'featureFlagEnabled', pure: false })
/** Template pipe that returns a feature payload when the feature is enabled. */
export class FeatureFlagEnabledPipe implements PipeTransform {
  private readonly flags = inject(FeatureFlagsService);

  /**
   * Returns the enabled feature payload for template truthiness checks.
   */
  transform(slug: string, scope: FeatureFlagScope): false | Record<string, unknown> {
    return this.flags.isEnabled(slug, scope);
  }
}
