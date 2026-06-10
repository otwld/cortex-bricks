import { Injectable } from '@nestjs/common';
import type { DefaultEventsMap, RemoteSocket } from 'socket.io';
import type { RoomId } from '@otwld/ts-websocket';

export type TypedFetchedSocket = RemoteSocket<DefaultEventsMap, unknown>;

/** Socket.IO broadcast target operations used by `TypedServer`. */
export interface TypedServerBroadcastTarget {
  /** Emit a payload to the selected target. */
  emit(event: string, payload: unknown): boolean;
}

/** Minimal Socket.IO namespace surface required by typed server emits. */
export interface TypedServerNamespace extends TypedServerBroadcastTarget {
  /** Scope the next emit to one or more rooms. */
  to(rooms: RoomId | RoomId[]): TypedServerBroadcastTarget;
  /** Exclude one or more rooms from the next emit. */
  except(rooms: RoomId | RoomId[]): TypedServerBroadcastTarget;
  /** Return sockets currently connected to the namespace. */
  fetchSockets(): Promise<readonly TypedFetchedSocket[]>;
}

/**
 * Registry of Socket.IO namespaces initialized by typed gateways.
 */
@Injectable()
export class TypedServerRegistry {
  private readonly namespaces = new Map<string, TypedServerNamespace>();

  /**
   * Register a namespace for later typed-server injection.
   *
   * @param namespace Contract namespace path.
   * @param ioNamespace Socket.IO namespace instance.
   */
  public register(namespace: string, ioNamespace: TypedServerNamespace): void {
    this.namespaces.set(namespace, ioNamespace);
  }

  /**
   * Retrieve an initialized namespace.
   *
   * @param namespace Contract namespace path.
   */
  public get(namespace: string): TypedServerNamespace {
    const found = this.namespaces.get(namespace);
    if (!found) throw new Error(`TypedServer namespace "${namespace}" has not been initialized`);
    return found;
  }
}
