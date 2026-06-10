import { Component, DestroyRef, computed, inject, input, output } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { Subject } from 'rxjs';

/**
 * Profile summary rendered in the banking dashboard header.
 */
export interface BankingHeaderProfile {
  readonly name: string;
  readonly avatarUrl: string;
  readonly avatarAlt?: string;
  readonly lastLoginLabel: string;
}

/**
 * Header action rendered as a PrimeNG icon button.
 */
export interface BankingHeaderAction {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly outlined?: boolean;
}

/**
 * Payload emitted when a header action is selected.
 */
export interface BankingHeaderActionEvent {
  readonly action: BankingHeaderAction;
}

/**
 * Union of events emitted by the banking header widget event stream.
 */
export type BankingHeaderWidgetEvent = { readonly type: 'action' } & BankingHeaderActionEvent;

interface BankingHeaderProfileViewModel extends BankingHeaderProfile {
  readonly avatarAlt: string;
  readonly title: string;
}

const DEFAULT_PROFILE: BankingHeaderProfile = {
  name: 'Isabel',
  avatarUrl: '/demo/images/avatar/circle/avatar-f-1.png',
  avatarAlt: 'Isabel avatar',
  lastLoginLabel: 'Your last login was on 04/05/2022 at 10:24 am',
};

const DEFAULT_ACTIONS: readonly BankingHeaderAction[] = [
  { id: 'exchange', label: 'Exchange', icon: 'pi pi-arrows-h', outlined: true },
  { id: 'withdraw', label: 'Withdraw', icon: 'pi pi-download', outlined: true },
  { id: 'send', label: 'Send', icon: 'pi pi-send' },
];

/**
 * Banking dashboard header with profile summary and quick actions.
 */
@Component({
  standalone: true,
  selector: 'app-header-widget',
  imports: [ButtonModule, TooltipModule],
  templateUrl: './header-widget.html',
})
export class HeaderWidget {
  private readonly destroyRef = inject(DestroyRef);
  private readonly eventsSubject = new Subject<BankingHeaderWidgetEvent>();

  /**
   * Profile rendered in the header.
   */
  readonly profile = input<BankingHeaderProfile>(DEFAULT_PROFILE);

  /**
   * Action buttons shown at the end of the header.
   */
  readonly actions = input<readonly BankingHeaderAction[]>(DEFAULT_ACTIONS);

  /**
   * Emits when a header action is selected.
   */
  readonly actionSelected = output<BankingHeaderActionEvent>();

  /**
   * RxJS stream of all user events emitted by this widget.
   */
  readonly events$ = this.eventsSubject.asObservable();

  public readonly profileViewModel = computed<BankingHeaderProfileViewModel>(() => {
    const profile = this.profile();

    return {
      ...profile,
      avatarAlt: profile.avatarAlt ?? `${profile.name} avatar`,
      title: `Welcome ${profile.name}`,
    };
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.eventsSubject.complete());
  }

  public selectAction(action: BankingHeaderAction): void {
    const event = { action };

    this.actionSelected.emit(event);
    this.eventsSubject.next({ type: 'action', ...event });
  }
}
