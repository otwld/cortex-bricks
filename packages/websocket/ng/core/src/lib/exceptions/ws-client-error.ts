import { WsError, type WsErrorArgs } from '@otwld/ts-websocket';

/**
 * Marker subclass for client-side websocket errors.
 */
export class WsClientError extends WsError {
  /** @param args Underlying error args. */
  public constructor(args: WsErrorArgs) {
    super(args);
    this.name = WsClientError.name;
  }
}
