import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { getOnEventDef } from './on-event.decorator';
import { ZodPayloadPipe } from '../pipes/zod-payload.pipe';

/**
 * Parameter decorator marking a handler argument as the typed websocket
 * payload validated by `@OnEvent`.
 */
export const WsPayload = createParamDecorator((_: unknown, ctx: ExecutionContext): unknown => {
  const payload = ctx.switchToWs().getData();
  const def = getOnEventDef(ctx.getHandler());
  return def ? new ZodPayloadPipe(def).transform(payload) : payload;
});
