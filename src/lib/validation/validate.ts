/**
 * Centralized validation utilities.
 * All API responses should go through safeValidate() before consumption.
 */
import { z, type ZodSchema, type ZodError } from 'zod';

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ZodError; summary: string };

/**
 * Validates data against a Zod schema.
 * Returns typed data on success, or error details on failure.
 * Never throws — always returns a result object.
 */
export function safeValidate<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const summary = result.error.issues
    .map(i => `${i.path.join('.')}: ${i.message}`)
    .join('; ');
  console.warn('[Validation] Schema mismatch:', summary);
  return { success: false, error: result.error, summary };
}

/**
 * Validates data, returning the parsed data or null on failure.
 * Logs a warning when validation fails.
 */
export function validateOrNull<T>(schema: ZodSchema<T>, data: unknown, context?: string): T | null {
  const result = safeValidate(schema, data);
  if (result.success) return result.data;
  console.warn(`[Validation:${context ?? 'unknown'}]`, (result as { summary: string }).summary);
  return null;
}

/**
 * Validates an array of items, filtering out invalid entries.
 * Returns only the valid items with a count of rejected items.
 */
export function validateArray<T>(
  schema: ZodSchema<T>,
  items: unknown[],
  context?: string,
): { valid: T[]; rejected: number } {
  let rejected = 0;
  const valid: T[] = [];
  for (const item of items) {
    const result = schema.safeParse(item);
    if (result.success) {
      valid.push(result.data);
    } else {
      rejected++;
    }
  }
  if (rejected > 0) {
    console.warn(`[Validation:${context ?? 'array'}] ${rejected}/${items.length} items rejected`);
  }
  return { valid, rejected };
}

/**
 * Data provenance metadata attached to validated payloads.
 */
export interface DataProvenance {
  source: string;
  updatedAt: number;
  status: 'ok' | 'degraded' | 'unavailable';
  rejectedCount?: number;
}

/**
 * Wraps validated data with provenance metadata.
 */
export function withProvenance<T>(
  data: T,
  source: string,
  opts?: { rejectedCount?: number },
): { data: T; provenance: DataProvenance } {
  return {
    data,
    provenance: {
      source,
      updatedAt: Date.now(),
      status: 'ok',
      ...(opts?.rejectedCount !== undefined && opts.rejectedCount > 0
        ? { status: 'degraded' as const, rejectedCount: opts.rejectedCount }
        : {}),
    },
  };
}
