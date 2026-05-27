/**
 * Describes ai tool descriptor values.
 */
export interface AiToolDescriptor {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  requiresApproval?: boolean;
}

/**
 * Describes ai tool call values.
 */
export interface AiToolCall {
  id: string;
  name: string;
  input: unknown;
}

/**
 * Describes ai tool result values.
 */
export interface AiToolResult {
  callId: string;
  result: unknown;
}
