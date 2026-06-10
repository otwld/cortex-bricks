import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { SubscribeMessage } from '@nestjs/websockets';
import type { AnyEventDef, ClientEventDef } from '@otwld/ts-websocket';
import { ZodResponseInterceptor } from '../interceptors/zod-response.interceptor';

/** Metadata key used to attach the event def to a handler method. */
export const ON_EVENT_DEF = Symbol.for('@otwld/nest-websocket:on-event-def');

/**
 * Method decorator that wires a Nest gateway handler to a typed event def.
 *
 * @param def Event definition this handler serves.
 */
export function OnEvent(def: AnyEventDef): MethodDecorator {
  const decorators = [
    SubscribeMessage(def.pattern),
    UseInterceptors(new ZodResponseInterceptor(def)),
  ];

  return (target, propertyKey, descriptor) => {
    if (descriptor.value) {
      Reflect.defineMetadata(ON_EVENT_DEF, def, descriptor.value);
    }
    return applyDecorators(...decorators)(target, propertyKey, descriptor);
  };
}

/**
 * Read the event def attached to a handler method by `@OnEvent`.
 *
 * @param target Method reference.
 */
export function getOnEventDef(target: unknown): AnyEventDef | undefined {
  if (typeof target !== 'function' && typeof target !== 'object') return undefined;
  return Reflect.getMetadata(ON_EVENT_DEF, target as object) as AnyEventDef | undefined;
}

export type { ClientEventDef };
