import {
  defineContract,
  serverEvent,
} from '@otwld/ts-websocket';
import { z } from 'zod';
import { WsValidationException } from '../exceptions/ws-validation.exception';
import { TypedServer } from './typed-server';
import { TypedServerRegistry } from './typed-server-registry';

const contract = defineContract({
  namespace: '/test',
  c2s: {},
  s2c: {
    ping: serverEvent('test.ping')
      .payload(z.object({ tick: z.number() }))
      .build(),
  },
});

const fakeIo = () => {
  const calls: Array<{ event: string; payload: unknown; rooms: string[] }> = [];
  let currentRooms: string[] = [];
  const namespace = {
    of: () => namespace,
    to(rooms: string | string[]) {
      currentRooms = Array.isArray(rooms) ? rooms : [rooms];
      return namespace;
    },
    except() {
      return namespace;
    },
    emit(event: string, payload: unknown) {
      calls.push({ event, payload, rooms: [...currentRooms] });
      currentRooms = [];
      return true;
    },
    fetchSockets: vi.fn(async () => []),
  };
  const registry = new TypedServerRegistry();
  registry.register(contract.namespace, namespace as never);
  return { registry, calls };
};

describe('TypedServer', () => {
  it('uses a registered namespace from the registry', async () => {
    const namespace = {
      emit: vi.fn(),
      to: vi.fn(() => ({ emit: vi.fn() })),
      except: vi.fn(() => ({ emit: vi.fn() })),
      fetchSockets: vi.fn(async () => []),
    };
    const registry = new TypedServerRegistry();
    registry.register(contract.namespace, namespace as never);

    const server = new TypedServer(contract, registry, {
      validateOutgoing: true,
    });
    await server.emit(contract.s2c.ping, { tick: 1 });

    expect(namespace.emit).toHaveBeenCalledWith('test.ping', { tick: 1 });
  });

  it('emits with namespace and scoped rooms', async () => {
    const { registry, calls } = fakeIo();
    const server = new TypedServer(contract, registry, {
      validateOutgoing: true,
    });

    await server.to('room-1').emit(contract.s2c.ping, { tick: 1 });

    expect(calls).toEqual([
      { event: 'test.ping', payload: { tick: 1 }, rooms: ['room-1'] },
    ]);
  });

  it('throws on invalid payload when validation enabled', async () => {
    const { registry } = fakeIo();
    const server = new TypedServer(contract, registry, {
      validateOutgoing: true,
    });

    await expect(
      server.emit(contract.s2c.ping, { tick: 'oops' } as never),
    ).rejects.toBeInstanceOf(WsValidationException);
  });

  it('skips validation when disabled', async () => {
    const { registry, calls } = fakeIo();
    const server = new TypedServer(contract, registry, {
      validateOutgoing: false,
    });

    await server.emit(contract.s2c.ping, { tick: 'oops' } as never);
    expect(calls).toEqual([
      { event: 'test.ping', payload: { tick: 'oops' }, rooms: [] },
    ]);
  });
});
