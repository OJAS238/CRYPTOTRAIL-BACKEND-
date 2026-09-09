import { describe, expect, it } from 'vitest';
import { normalizeAddress } from './validation.js';

describe('normalizeAddress', () => {
  it('normalizes a valid Ethereum address', () => expect(normalizeAddress('0x0000000000000000000000000000000000000001')).toBe('0x0000000000000000000000000000000000000001'));
  it('rejects an invalid address', () => expect(normalizeAddress('not-an-address')).toBeUndefined());
});
