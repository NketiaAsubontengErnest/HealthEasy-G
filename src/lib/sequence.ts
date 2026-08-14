/**
 * Human-readable document numbers (MRN, invoice, claim, accession).
 *
 * These were previously derived from `model.count() + 1`, which produces a
 * duplicate whenever two clerks register at the same moment, and silently
 * reuses a number after any row is deleted. Both cases violate a unique
 * constraint and lose the write.
 *
 * `withUniqueNumber` retries against the unique index, which is the only
 * authority that can actually settle a collision.
 */

const PRISMA_UNIQUE_VIOLATION = 'P2002';

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === PRISMA_UNIQUE_VIOLATION;
}

export async function withUniqueNumber<T>(
  nextNumber: (attempt: number) => Promise<string>,
  create: (value: string) => Promise<T>,
  maxAttempts = 5
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const value = await nextNumber(attempt);
    try {
      return await create(value);
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Could not allocate a unique document number after several attempts.');
}

/** `PREFIX-2026-00042` style numbering. */
export function formatSequence(prefix: string, sequence: number, width = 5, year = new Date().getFullYear()): string {
  return `${prefix}-${year}-${String(sequence).padStart(width, '0')}`;
}
