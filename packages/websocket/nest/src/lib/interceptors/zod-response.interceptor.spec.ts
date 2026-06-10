import { clientEvent } from '@otwld/ts-websocket';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { lastValueFrom, of, throwError } from 'rxjs';
import { z } from 'zod';
import { WsValidationException } from '../exceptions/ws-validation.exception';
import { ZodResponseInterceptor } from './zod-response.interceptor';

const fakeContext = new ExecutionContextHost([]);
fakeContext.setType('ws');
const handlerFor = (value: unknown) => ({ handle: () => of(value) });

describe('ZodResponseInterceptor', () => {
  const def = clientEvent('chat.send')
    .payload(z.object({}))
    .response(z.object({ id: z.string() }))
    .build();

  it('passes through valid responses', async () => {
    const interceptor = new ZodResponseInterceptor(def);
    const result = await lastValueFrom(interceptor.intercept(fakeContext, handlerFor({ id: 'x' })));
    expect(result).toEqual({ id: 'x' });
  });

  it('throws WsValidationException on invalid response', async () => {
    const interceptor = new ZodResponseInterceptor(def);
    await expect(
      lastValueFrom(interceptor.intercept(fakeContext, handlerFor({ id: 42 }))),
    ).rejects.toBeInstanceOf(WsValidationException);
  });

  it('passes through if no responseSchema', async () => {
    const fafDef = clientEvent('chat.typing').payload(z.object({})).build();
    const interceptor = new ZodResponseInterceptor(fafDef);
    const result = await lastValueFrom(interceptor.intercept(fakeContext, handlerFor(undefined)));
    expect(result).toBeUndefined();
  });

  it('forwards upstream errors unchanged', async () => {
    const interceptor = new ZodResponseInterceptor(def);
    const upstream = new Error('boom');
    await expect(
      lastValueFrom(interceptor.intercept(fakeContext, { handle: () => throwError(() => upstream) })),
    ).rejects.toBe(upstream);
  });
});
