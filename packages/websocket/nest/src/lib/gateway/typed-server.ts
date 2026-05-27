import type { Namespace, Socket } from 'socket.io';
import {
  WsErrorKind,
  type Contract,
  type PayloadOf,
  type RoomId,
  type S2cKeys,
  type ServerEventDef,
} from '@otwld/ts-websocket';
import { WsValidationException } from '../exceptions/ws-validation.exception';
import { TypedServerRegistry } from './typed-server-registry';

/**
 * Typed emitter scoped to a set of rooms.
 *
 * @typeParam TContract Owning contract.
 */
export interface TypedRoomEmitter<TContract extends Contract> {
  /**
   * Emit a server event to the scoped rooms.
   *
   * @param event Server event definition.
   * @param payload Payload to emit.
   */
  emit<K extends S2cKeys<TContract>>(
    event: TContract['s2c'][K],
    payload: PayloadOf<TContract['s2c'][K]>,
  ): Promise<void>;
}

/**
 * Runtime options for `TypedServer`.
 */
export interface TypedServerOptions {
  /** When true, every emit validates the payload via zod. */
  validateOutgoing: boolean;
}

/**
 * Namespace-scoped typed server for a given contract.
 *
 * @typeParam TContract Owning contract.
 */
export class TypedServer<TContract extends Contract> {
  /**
   * @param contract Source contract.
   * @param registry Namespace registry.
   * @param options Behavior knobs.
   */
  public constructor(
    private readonly contract: TContract,
    private readonly registry: TypedServerRegistry,
    private readonly options: TypedServerOptions,
  ) {}

  /**
   * Emit to all sockets in the namespace.
   *
   * @param event Server event definition.
   * @param payload Payload to send.
   */
  public async emit<K extends S2cKeys<TContract>>(
    event: TContract['s2c'][K],
    payload: PayloadOf<TContract['s2c'][K]>,
  ): Promise<void> {
    const validated = this.validate(event, payload);
    this.namespace.emit(event.pattern, validated);
  }

  /**
   * Restrict subsequent `emit` calls to the given rooms.
   *
   * @param rooms Single room id or array of room ids.
   */
  /**
   * Runs to.
   *
   * @param rooms - rooms value.
   *
   * @returns The typed server to result.
   */
  public to(rooms: RoomId | readonly RoomId[]): TypedRoomEmitter<TContract> {
    const list = Array.isArray(rooms) ? [...rooms] : [rooms];
    return {
      emit: async (event, payload) => {
        const validated = this.validate(event, payload);
        this.namespace.to(list).emit(event.pattern, validated);
      },
    };
  }

  /**
   * Exclude the given rooms from the next emit.
   *
   * @param rooms Single room id or array of room ids.
   */
  /**
   * Runs except.
   *
   * @param rooms - rooms value.
   *
   * @returns The typed server except result.
   */
  public except(rooms: RoomId | readonly RoomId[]): TypedRoomEmitter<TContract> {
    const list = Array.isArray(rooms) ? [...rooms] : [rooms];
    return {
      emit: async (event, payload) => {
        const validated = this.validate(event, payload);
        this.namespace.except(list).emit(event.pattern, validated);
      },
    };
  }

  /** Fetch every connected socket in the namespace. */
  /**
   * Runs fetch sockets.
   *
   * @returns The typed server fetch sockets result.
   */
  public async fetchSockets(): Promise<readonly Socket[]> {
    const sockets = await this.namespace.fetchSockets();
    return sockets as unknown as readonly Socket[];
  }

  private get namespace(): Namespace {
    return this.registry.get(this.contract.namespace);
  }

  private validate(event: ServerEventDef<string, unknown>, payload: unknown): unknown {
    if (!this.options.validateOutgoing) return payload;
    const result = event.payloadSchema.safeParse(payload);
    if (!result.success) {
      throw new WsValidationException({
        kind: WsErrorKind.InvalidPayload,
        message: `Outgoing payload validation failed for "${event.pattern}"`,
        pattern: event.pattern,
        issues: result.error.issues,
      });
    }
    return result.data;
  }
}
