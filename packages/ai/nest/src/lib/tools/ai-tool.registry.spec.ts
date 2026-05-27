import { z } from 'zod';
import { AiToolRegistry } from './ai-tool.registry';

describe('AiToolRegistry', () => {
  it('stores frontend-safe descriptors', () => {
    const registry = new AiToolRegistry();
    registry.register({
      name: 'echo',
      description: 'Echo input',
      inputSchema: z.object({ value: z.string() }),
      execute: async ({ value }) => value,
    });

    expect(registry.listDescriptors()).toEqual([
      {
        name: 'echo',
        description: 'Echo input',
        inputSchema: {
          type: 'object',
          properties: {
            value: { type: 'string' },
          },
          required: ['value'],
          additionalProperties: false,
        },
        requiresApproval: false,
      },
    ]);
  });

  it('exposes registered tool definitions for provider execution', async () => {
    const registry = new AiToolRegistry();
    registry.register({
      name: 'echo',
      description: 'Echo input',
      inputSchema: z.object({ value: z.string() }),
      execute: async ({ value }) => value,
    });

    const definition = registry.listDefinitions()[0];

    await expect(definition.execute({ value: 'Hello' })).resolves.toBe('Hello');
  });
});
