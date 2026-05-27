import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { AiException } from '../exceptions/ai.exception';

/**
 * Provides ai object schema registry behavior.
 */
@Injectable()
export class AiObjectSchemaRegistry {
  private readonly schemas = new Map<string, z.ZodTypeAny>();

  /**
   * Runs register.
   *
   * @param key - key value.
   *
   * @param schema - schema value.
   */
  register(key: string, schema: z.ZodTypeAny): void {
    this.schemas.set(key, schema);
  }

  /**
   * Runs get.
   *
   * @param key - key value.
   *
   * @returns The ai object schema registry get result.
   *
   * @throws When the operation cannot be completed.
   */
  get(key: string): z.ZodTypeAny {
    const schema = this.schemas.get(key);
    if (!schema) throw AiException.schemaNotFound(key);
    return schema;
  }

  /**
   * Runs list keys.
   *
   * @returns The ai object schema registry list keys result.
   */
  listKeys(): string[] {
    return Array.from(this.schemas.keys()).sort();
  }
}
