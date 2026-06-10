import { Injectable } from '@nestjs/common';
import { AiToolDescriptor } from '@otwld/ts-ai';
import { z } from 'zod';
import { AiToolDefinition } from './ai-tool-definition';

/** Registry for tool definitions exposed to AI provider calls and clients. */
@Injectable()
export class AiToolRegistry {
  private readonly tools = new Map<string, AiToolDefinition>();

  /** Register or replace a tool definition by name. */
  register(definition: AiToolDefinition): void {
    this.tools.set(definition.name, definition);
  }

  /** Return a registered tool definition by name. */
  get(name: string): AiToolDefinition | undefined {
    return this.tools.get(name);
  }

  /** List registered executable tool definitions. */
  listDefinitions(): AiToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /** List client-safe tool descriptors with JSON-schema input shapes. */
  listDescriptors(): AiToolDescriptor[] {
    return Array.from(this.tools.values()).map((definition) => ({
      name: definition.name,
      description: definition.description,
      inputSchema: this.toJsonSchema(definition.inputSchema),
      requiresApproval: definition.requiresApproval ?? false,
    }));
  }

  private toJsonSchema(schema: z.ZodTypeAny): Record<string, unknown> {
    if (schema instanceof z.ZodObject) {
      const shape = schema.shape as Record<string, z.ZodTypeAny>;
      const entries = Object.entries(shape);
      const required = entries.filter(([, propertySchema]) => !propertySchema.isOptional()).map(([key]) => key);

      return this.withDescription(schema, {
        type: 'object',
        properties: Object.fromEntries(entries.map(([key, propertySchema]) => [key, this.toJsonSchema(propertySchema)])),
        ...(required.length > 0 ? { required } : {}),
        additionalProperties: false,
      });
    }

    if (schema instanceof z.ZodArray) {
      return this.withDescription(schema, {
        type: 'array',
        items: this.toJsonSchema(schema.element),
      });
    }

    if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
      return this.toJsonSchema(schema.unwrap());
    }

    if (schema instanceof z.ZodString) return this.withDescription(schema, { type: 'string' });
    if (schema instanceof z.ZodBoolean) return this.withDescription(schema, { type: 'boolean' });
    if (schema instanceof z.ZodEnum) return this.withDescription(schema, { type: 'string', enum: schema.options });

    if (schema instanceof z.ZodNumber) {
      const checks = schema._def.checks as Array<{ kind: string }>;
      return this.withDescription(schema, { type: checks.some((check) => check.kind === 'int') ? 'integer' : 'number' });
    }

    return this.withDescription(schema, {});
  }

  private withDescription(schema: z.ZodTypeAny, jsonSchema: Record<string, unknown>): Record<string, unknown> {
    return schema.description ? { ...jsonSchema, description: schema.description } : jsonSchema;
  }
}
