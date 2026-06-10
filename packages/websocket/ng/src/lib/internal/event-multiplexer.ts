import {
  WsError,
  WsErrorKind,
  WsValidationError,
  type Contract,
  type PayloadOf,
  type S2cKeys,
} from '@otwld/ts-websocket';
import { Observable, Subject, type Observer } from 'rxjs';

/** Source factory for raw event streams keyed by pattern. */
export type RawEventSource = (pattern: string) => Observable<unknown>;

/**
 * Multiplexes raw socket events into validated per-event observables.
 *
 * @typeParam TContract Owning contract.
 */
export class EventMultiplexer<TContract extends Contract> {
  private readonly errors = new Subject<WsError>();

  /** Stream of inbound validation errors. */
  public readonly errors$ = this.errors.asObservable();

  /**
   * @param contract Source contract.
   * @param source Factory that returns raw payload streams per pattern.
   */
  public constructor(
    private readonly contract: TContract,
    private readonly source: RawEventSource,
  ) {
    void this.contract;
  }

  /**
   * Get the validated stream for an s2c event definition.
   *
   * @param def Server event definition.
   */
  public on<K extends S2cKeys<TContract>>(
    def: TContract['s2c'][K],
  ): Observable<PayloadOf<TContract['s2c'][K]>> {
    return new Observable((subscriber: Observer<PayloadOf<TContract['s2c'][K]>>) => {
      const sub = this.source(def.pattern).subscribe({
        next: (raw) => {
          try {
            subscriber.next(def.parse(raw) as PayloadOf<TContract['s2c'][K]>);
          } catch (err) {
            if (err instanceof WsValidationError) {
              this.errors.next(err);
            } else {
              this.errors.next(
                new WsError({
                  kind: WsErrorKind.InvalidPayload,
                  message: err instanceof Error ? err.message : 'Invalid payload',
                  pattern: def.pattern,
                }),
              );
            }
          }
        },
        error: (err: unknown) => subscriber.error(err),
        complete: () => subscriber.complete(),
      });
      return () => sub.unsubscribe();
    });
  }
}
