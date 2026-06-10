import {
  computed,
  Directive,
  effect,
  inject,
  input,
  Input,
  signal,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { ConnectionState, type Contract } from '@otwld/ts-websocket';
import { WsClient } from '../services/ws-client.service';

/**
 * Structural directive that renders only while the client state matches.
 */
@Directive({ selector: '[wsConnected]' })
export class WsConnectedDirective {
  private readonly viewRef = inject(ViewContainerRef);
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly defaultClient = inject(WsClient<Contract>, { optional: true });
  private readonly targetState = signal<ConnectionState | 'connected'>('connected');
  private rendered = false;

  /** Explicit contract-scoped client. */
  public readonly wsConnectedClient = input<WsClient<Contract> | null>(null);

  /** Optional state to match. Defaults to connected. */
  @Input()
  public set wsConnected(value: ConnectionState | '' | undefined | null) {
    this.targetState.set(value ? value : 'connected');
  }

  public constructor() {
    const matches = computed(() => {
      const client = this.wsConnectedClient() ?? this.defaultClient;
      const state = client?.state() ?? ConnectionState.Disconnected;
      const targetState = this.targetState();
      return targetState === 'connected' ? state === ConnectionState.Connected : state === targetState;
    });

    effect(() => {
      const shouldRender = matches();
      if (shouldRender && !this.rendered) {
        this.viewRef.createEmbeddedView(this.tpl);
        this.rendered = true;
      } else if (!shouldRender && this.rendered) {
        this.viewRef.clear();
        this.rendered = false;
      }
    });
  }
}
