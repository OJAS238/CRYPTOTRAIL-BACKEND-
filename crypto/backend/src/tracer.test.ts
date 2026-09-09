import { describe, expect, it } from 'vitest';
import { deterministicExplanation } from './tracer.js';

describe('deterministic explanation', () => {
  it('does not imply attribution when no candidate was matched', () => {
    expect(deterministicExplanation('0x0000000000000000000000000000000000000001', [])).toContain('No known VASP');
  });
});
