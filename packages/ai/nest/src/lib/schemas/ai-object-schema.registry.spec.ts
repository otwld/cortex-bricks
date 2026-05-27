import { z } from 'zod';
import { AiException } from '../exceptions/ai.exception';
import { AiObjectSchemaRegistry } from './ai-object-schema.registry';

describe('AiObjectSchemaRegistry', () => {
  it('resolves registered schemas', () => {
    const registry = new AiObjectSchemaRegistry();
    const schema = z.object({ title: z.string() });

    registry.register('summary', schema);

    expect(registry.get('summary')).toBe(schema);
  });

  it('throws for missing schemas', () => {
    const registry = new AiObjectSchemaRegistry();

    expect(() => registry.get('missing')).toThrow(AiException);
  });
});
