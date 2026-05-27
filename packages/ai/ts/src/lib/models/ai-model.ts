/**
 * Represents ai model capability.
 */
export type AiModelCapability = 'chat' | 'completion' | 'object' | 'tools';

/**
 * Describes ai model alias values.
 */
export interface AiModelAlias {
  alias: string;
  providerModel: string;
  capabilities: AiModelCapability[];
  label?: string;
}
