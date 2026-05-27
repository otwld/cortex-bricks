import { Pipe, PipeTransform, inject } from '@angular/core';
import { AbilityService } from './ability.service';

/**
 * Template pipe that checks whether the current user can perform an action on a subject.
 *
 * @example
 * ```html
 * @if ('read' | can: 'Invoice') {
 *   <a routerLink="/invoices">Invoices</a>
 * }
 * ```
 */
@Pipe({ name: 'can', standalone: true, pure: false })
export class CanPipe implements PipeTransform {
  /**
   * Authorization service that exposes the current CASL ability.
   */
  private readonly abilityService = inject(AbilityService);

  /**
   * Tests the current ability against an action and subject pair.
   *
   * @param action - Permission action to check, such as `read`, `update`, or `manage`.
   * @param subject - Permission subject to check, such as `Invoice`, `Project`, or `all`.
   * @returns `true` when the current user has the requested permission; otherwise `false`.
   *
   * @example
   * ```ts
   * const visible = pipe.transform('manage', 'Project');
   * ```
   */
  transform(action: string, subject: string): boolean {
    return this.abilityService.ability().can(action, subject);
  }
}
