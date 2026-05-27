import { Injectable } from '@nestjs/common';
import type { Namespace } from 'socket.io';

/**
 * Registry of Socket.IO namespaces initialized by typed gateways.
 */
@Injectable()
export class TypedServerRegistry {
  private readonly namespaces = new Map<string, Namespace>();

  /**
   * Register a namespace for later typed-server injection.
   *
   * @param namespace Contract namespace path.
   * @param ioNamespace Socket.IO namespace instance.
   */
  public register(namespace: string, ioNamespace: Namespace): void {
    this.namespaces.set(namespace, ioNamespace);
  }

  /**
   * Retrieve an initialized namespace.
   *
   * @param namespace Contract namespace path.
   */
  /**
   * Runs get.
   *
   * @param namespace - namespace value.
   *
   * @returns The typed server registry get result.
   *
   * @throws When the operation cannot be completed.
   */
  public get(namespace: string): Namespace {
    const found = this.namespaces.get(namespace);
    if (!found) throw new Error(`TypedServer namespace "${namespace}" has not been initialized`);
    return found;
  }
}
