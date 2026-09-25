import type { ContextEntry } from '@playground/shared';

export type ProviderErrorCode =
  'authentication' | 'rate-limit' | 'network' | 'cancelled' | 'invalid-output';
export interface GenerationRequest {
  instruction: string;
  context: readonly ContextEntry[];
  files: Readonly<Record<string, string>>;
  signal: AbortSignal;
}
export type ProviderEvent =
  | { type: 'text'; text: string }
  | { type: 'proposal'; files: Record<string, string>; assumptions: string[]; summary: string }
  | { type: 'error'; code: ProviderErrorCode; message: string }
  | { type: 'done' };

/** Backend-only contract. Providers propose data; they never receive filesystem/shell tools. */
export interface AIProvider {
  readonly id: string;
  verify(signal: AbortSignal): Promise<void>;
  generate(request: GenerationRequest): AsyncIterable<ProviderEvent>;
}

// No provider implementation or fake success in Phase 1.
