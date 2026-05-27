import { z } from 'zod';

/**
 * Describes ai tool definition values.
 */
export interface AiToolDefinition<TInput extends z.ZodTypeAny = z.ZodTypeAny, TResult = unknown> {
  name: string;
  description: string;
  inputSchema: TInput;
  requiresApproval?: boolean;
  execute(input: z.infer<TInput>): Promise<TResult> | TResult;
}
