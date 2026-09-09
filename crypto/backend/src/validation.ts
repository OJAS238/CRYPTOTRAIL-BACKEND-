import { getAddress, isAddress } from 'viem';

export function normalizeAddress(value: unknown): string | undefined {
  if (typeof value !== 'string' || !isAddress(value, { strict: false })) return undefined;
  try { return getAddress(value); } catch { return undefined; }
}

