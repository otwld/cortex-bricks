import type { Server } from 'socket.io';

/**
 * Pluggable horizontal-scaling adapter.
 */
export abstract class WsScalingAdapter {
  /**
   * Attach the adapter to the given Socket.IO server.
   *
   * @param io Socket.IO server instance.
   */
  public abstract install(io: Server): Promise<void>;

  /** Release any resources owned by the adapter. */
  public abstract dispose(): Promise<void>;
}
