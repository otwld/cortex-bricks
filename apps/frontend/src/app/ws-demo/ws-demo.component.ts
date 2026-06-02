import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChatContract, type ChatMessage } from '@otwld/ts-chat';
import { WS_CLIENT } from '@otwld/ng-websocket';

/** Minimal websocket demo used by the Playwright smoke test. */
@Component({
  selector: 'app-ws-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        padding: 2rem;
        background: #f8fafc;
        color: #0f172a;
      }

      .ws-demo {
        max-width: 48rem;
        margin: 0 auto;
      }

      .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
        margin: 1rem 0;
      }

      button {
        min-height: 2.5rem;
        border: 1px solid #94a3b8;
        border-radius: 0.375rem;
        padding: 0 1rem;
        background: #ffffff;
        color: #0f172a;
        font: inherit;
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      ul {
        display: grid;
        gap: 0.5rem;
        padding: 0;
        list-style: none;
      }

      li {
        border: 1px solid #cbd5e1;
        border-radius: 0.375rem;
        padding: 0.75rem;
        background: #ffffff;
      }
    `,
  ],
  template: `
    <main class="ws-demo">
      <h1>WS demo</h1>
      <p data-testid="state">State: {{ state() }}</p>
      <p data-testid="connected">Connected: {{ connected() }}</p>
      <p data-testid="joined">Joined: {{ joined() }}</p>

      <div class="toolbar">
        <button data-testid="join" type="button" (click)="join()" [disabled]="joining()">
          Join
        </button>
        <button data-testid="send" type="button" (click)="send()" [disabled]="!connected()">
          Send
        </button>
      </div>

      <ul aria-label="Messages">
        @for (message of messages(); track message.id) {
          <li data-testid="message">{{ message.authorId }}: {{ message.text }}</li>
        }
      </ul>
    </main>
  `,
})
export class WsDemoComponent {
  private readonly client = inject(WS_CLIENT(ChatContract));
  private readonly destroyRef = inject(DestroyRef);
  private readonly room = this.client.room('demo-room');

  protected readonly state = this.client.state;
  protected readonly connected = this.client.connected;
  protected readonly joined = this.room.joined;
  protected readonly joining = signal(false);
  protected readonly messages = signal<ChatMessage[]>([]);

  public constructor() {
    this.destroyRef.onDestroy(() => {
      void this.client.disconnect();
    });

    this.client
      .on(ChatContract.s2c.newMessage)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((message) => {
        this.messages.update((current) => [...current, message]);
      });
  }

  /**
   * Join the shared demo room.
   *
   * @returns Promise that resolves after the room join ack arrives.
   */
  protected async join(): Promise<void> {
    this.joining.set(true);
    try {
      await this.room.join();
    } finally {
      this.joining.set(false);
    }
  }

  /**
   * Send a deterministic demo message to the shared room.
   *
   * @returns Promise that resolves after the send ack arrives.
   */
  protected async send(): Promise<void> {
    await this.client.emitWithAck(ChatContract.c2s.send, {
      roomId: this.room.id,
      text: 'hello from demo',
    });
  }
}
