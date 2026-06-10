import { applyDecorators, SetMetadata, type Type } from '@nestjs/common';
import { WebSocketGateway } from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import type { Contract } from '@otwld/ts-websocket';
import type { WebsocketCorsOptions } from '../config/websocket-module-options';
import { getWebsocketLifecycleDelegate } from '../gateway/connection-context';

/** Metadata key holding the contract attached to a typed gateway class. */
export const TYPED_GATEWAY_CONTRACT = Symbol.for(
  '@otwld/nest-websocket:gateway-contract',
);

/** Metadata key holding gateway-level options. */
export const TYPED_GATEWAY_OPTIONS = Symbol.for(
  '@otwld/nest-websocket:gateway-options',
);

const TYPED_GATEWAY_LIFECYCLE_WRAPPED = Symbol.for(
  '@otwld/nest-websocket:lifecycle-wrapped',
);

/**
 * Per-gateway options.
 */
export interface TypedGatewayOptions {
  /** When true the auth adapter must return a non-null user. Defaults to true. */
  requireAuth?: boolean;
  /** Override module-level CORS, or inherit it by passing `inherit`. */
  cors?: WebsocketCorsOptions | 'inherit';
}

/**
 * Class decorator that wires a Nest gateway to a typed websocket contract.
 *
 * @param contract Contract this gateway serves.
 * @param options Per-gateway options.
 */
export function TypedGateway<TContract extends Contract>(
  contract: TContract,
  options: TypedGatewayOptions = {},
): ClassDecorator {
  const cors = options.cors === 'inherit' ? undefined : options.cors;

  return (target) => {
    installLifecycleHooks(target);
    applyDecorators(
      WebSocketGateway({
        namespace: contract.namespace,
        ...(cors ? { cors } : {}),
      }),
      SetMetadata(TYPED_GATEWAY_CONTRACT, contract),
      SetMetadata(TYPED_GATEWAY_OPTIONS, { requireAuth: options.requireAuth ?? true, cors }),
    )(target);
  };
}

/**
 * Read the contract attached by `@TypedGateway`.
 *
 * @param target Gateway class or instance.
 */
export function getTypedGatewayContract(target: Type<unknown> | object): Contract | undefined {
  const ctor = typeof target === 'function' ? target : target.constructor;
  return Reflect.getMetadata(TYPED_GATEWAY_CONTRACT, ctor) as Contract | undefined;
}

function installLifecycleHooks(target: { prototype: unknown }): void {
  const prototype = target.prototype as LifecyclePrototype;

  wrapLifecycleHook(prototype, 'afterInit', async function afterInit(
    this: object,
    original,
    server: unknown,
  ): Promise<void> {
    await getWebsocketLifecycleDelegate()?.handleInit(server, this);
    await original?.call(this, server);
  });

  wrapLifecycleHook(prototype, 'handleConnection', async function handleConnection(
    this: object,
    original,
    socket: Socket,
  ): Promise<void> {
    await getWebsocketLifecycleDelegate()?.handleConnection(socket, this);
    await original?.call(this, socket);
  });

  wrapLifecycleHook(prototype, 'handleDisconnect', async function handleDisconnect(
    this: object,
    original,
    socket: Socket,
  ): Promise<void> {
    await getWebsocketLifecycleDelegate()?.handleDisconnect(socket, this);
    await original?.call(this, socket);
  });
}

type LifecycleHookName = 'afterInit' | 'handleConnection' | 'handleDisconnect';

type LifecyclePrototype = Partial<Record<LifecycleHookName, LifecycleHook>>;

type LifecycleHook<TArg = unknown> = ((arg: TArg) => unknown) & {
  [TYPED_GATEWAY_LIFECYCLE_WRAPPED]?: true;
};

function wrapLifecycleHook<TArg>(
  prototype: LifecyclePrototype,
  key: LifecycleHookName,
  wrapper: (this: object, original: LifecycleHook<TArg> | undefined, arg: TArg) => Promise<void>,
): void {
  const original = prototype[key] as LifecycleHook<TArg> | undefined;
  if (original?.[TYPED_GATEWAY_LIFECYCLE_WRAPPED]) return;

  const wrapped = async function typedGatewayLifecycleHook(this: object, arg: TArg): Promise<void> {
    await wrapper.call(this, original, arg);
  } as LifecycleHook<TArg>;
  wrapped[TYPED_GATEWAY_LIFECYCLE_WRAPPED] = true;

  Object.defineProperty(prototype, key, {
    configurable: true,
    value: wrapped,
  });
}
