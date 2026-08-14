import { NextResponse } from 'next/server';

/** Small, dependency-free validation helpers for safety-critical route input. */
export function requiredString(value: unknown, name: string, max = 500): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new Error(`${name} is required and must be at most ${max} characters.`);
  }
  return value.trim();
}

export function finiteNumber(value: unknown, name: string, min: number, max: number): number {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new Error(`${name} must be a number between ${min} and ${max}.`);
  }
  return number;
}

export function badRequest(error: unknown) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'Invalid request data.' },
    { status: 400 }
  );
}
