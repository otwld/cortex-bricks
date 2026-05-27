import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { map, type Observable } from 'rxjs';
import { WsErrorKind, type AnyEventDef } from '@otwld/ts-websocket';
import { WsValidationException } from '../exceptions/ws-validation.exception';

/**
 * Validates handler return values against an event def's `responseSchema`.
 */
export class ZodResponseInterceptor implements NestInterceptor<unknown, unknown> {
  /**
   * @param def Event definition whose response schema is enforced.
   */
  public constructor(private readonly def: AnyEventDef) {}

  /**
   * Intercept the handler result and validate ack responses when configured.
   *
   * @param _context Nest execution context.
   * @param next Next handler in the chain.
   */
  public intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const responseSchema = this.def.direction === 'c2s' ? this.def.responseSchema : undefined;
    if (!responseSchema) return next.handle();

    return next.handle().pipe(
      map((value) => {
        const parsed = responseSchema.safeParse(value);
        if (!parsed.success) {
          throw new WsValidationException({
            kind: WsErrorKind.InvalidResponse,
            message: `Response validation failed for "${this.def.pattern}"`,
            pattern: this.def.pattern,
            issues: parsed.error.issues,
          });
        }
        return parsed.data;
      }),
    );
  }
}
