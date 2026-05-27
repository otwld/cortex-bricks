import { Test } from '@nestjs/testing';
import {
  clientEvent,
  defineContract,
  serverEvent,
} from '@otwld/ts-websocket';
import { z } from 'zod';
import { OnEvent } from './on-event.decorator';
import { TypedGateway } from './typed-gateway.decorator';
import { WsPayload } from './ws-payload.decorator';

const contract = defineContract({
  namespace: '/echo',
  c2s: {
    echo: clientEvent('echo')
      .payload(z.object({ msg: z.string() }))
      .response(z.object({ msg: z.string() }))
      .build(),
  },
  s2c: {
    pong: serverEvent('pong').payload(z.object({})).build(),
  },
});

@TypedGateway(contract, { requireAuth: false })
class EchoGateway {
  @OnEvent(contract.c2s.echo)
  public handleEcho(@WsPayload() payload: { msg: string }): { msg: string } {
    return { msg: payload.msg.toUpperCase() };
  }
}

describe('@OnEvent', () => {
  it('attaches @SubscribeMessage metadata for the def.pattern', () => {
    const proto = EchoGateway.prototype as unknown as Record<string, unknown>;
    const message = Reflect.getMetadata('message', proto['handleEcho'] as object) as
      | string
      | undefined;
    expect(message).toBe('echo');
  });

  it('keeps the gateway handler callable after decoration', async () => {
    const moduleRef = await Test.createTestingModule({ providers: [EchoGateway] }).compile();
    const gateway = moduleRef.get(EchoGateway);
    expect(gateway.handleEcho({ msg: 'hi' })).toEqual({ msg: 'HI' });
  });
});
