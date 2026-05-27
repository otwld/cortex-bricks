import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';

/** Nest pipe that validates request values with a zod schema. */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  /** Creates a zod validation pipe. */
  constructor(private readonly schema: ZodSchema<T>) {}

  /** Validates and returns the parsed value or throws a 400 response. */
  transform(value: unknown): T {
    const parsed = this.schema.safeParse(value);
    if (parsed.success) return parsed.data;

    const message = parsed.error.issues.map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`).join('; ');
    throw new BadRequestException(message);
  }
}
