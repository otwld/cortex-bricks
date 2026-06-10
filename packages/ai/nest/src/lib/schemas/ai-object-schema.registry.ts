import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { AiException } from '../exceptions/ai.exception';

/** Registry for Zod schemas available to AI object generation endpoints. */
@Injectable()
export class AiObjectSchemaRegistry {
  private readonly schemas = new Map<string, z.ZodTypeAny>();

  /** Register or replace a schema by key. */
  register(key: string, schema: z.ZodTypeAny): void {
    this.schemas.set(key, schema);
  }

  /** Return a registered schema or throw a typed AI error. */
  get(key: string): z.ZodTypeAny {
    const schema = this.schemas.get(key);
    if (!schema) throw AiException.schemaNotFound(key);
    return schema;
  }

  /** List registered schema keys in stable order. */
  listKeys(): string[] {
    return Array.from(this.schemas.keys()).sort();
  }
}
