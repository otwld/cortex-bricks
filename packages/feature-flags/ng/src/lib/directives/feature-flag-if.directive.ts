import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';

import { FeatureFlagsService } from '../feature-flags.service';
import type { FeatureFlagScope } from '../feature-flags.types';

/**
 * Structural directive to conditionally render a template when a feature is enabled.
 *
 * Usage:
 *   <section *featureFlagIf="'job-offer-visibility'; featureFlagIfScope: 'app'">...</section>
 */
@Directive({ selector: '[featureFlagIf]' })
/** Structural directive that renders its content only when a feature is enabled. */
export class FeatureFlagIfDirective {
  private readonly template = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly flags = inject(FeatureFlagsService);

  /** Feature slug to evaluate. */
  public readonly feature = input.required<string>({ alias: 'featureFlagIf' });

  /** Evaluation scope; defaults to `app`. */
  public readonly scope = input<FeatureFlagScope>('app', { alias: 'featureFlagIfScope' });

  /** Optional else template to render when disabled. */
  public readonly elseTemplate = input<TemplateRef<unknown> | null>(null, { alias: 'featureFlagIfElse' });

  constructor() {
    effect(() => {
      const elseTemplate = this.elseTemplate();
      this.viewContainer.clear();

      const isEnabled = this.flags.isEnabled(this.feature(), this.scope());

      if (isEnabled) {
        this.viewContainer.createEmbeddedView(this.template, { $implicit: isEnabled });
      } else if (elseTemplate) {
        this.viewContainer.createEmbeddedView(elseTemplate, { $implicit: isEnabled });
      }
    });
  }
}
