import { expect, it } from 'vitest';
import { toCryptoTrail } from './cryptotrail.js';
import { multiHopDemo } from './demos.js';
it('adapts a two-hop trace without inventing unknown telemetry', async () => {
    const raw = await multiHopDemo();
    const result = toCryptoTrail(raw, 123);
    expect(result.totalHops).toBe(2);
    expect(result.nodes).toHaveLength(3);
    expect(result.confidenceScore).toBe(86);
    expect(result.queryAddress).toBe(raw.sourceAddress);
    expect(result.rawTrace).toEqual(raw);
    expect(result.volumeTracedUsd).toBeNull();
    expect(result.flaggedMixers).toBeNull();
    expect(result.nodes[1].amountEth).toBe(2);
});
it('does not fabricate a chain from unrelated branch nodes', async () => {
    const raw = await multiHopDemo();
    raw.nodes.splice(1, 0, { id: 'unrelated', address: 'unrelated', kind: 'wallet', label: 'unrelated', depth: 1 });
    expect(toCryptoTrail(raw, 1).nodes.map(node => node.id)).not.toContain('unrelated');
});
it('handles no match without asserting a destination', async () => {
    const raw = await multiHopDemo();
    raw.candidates = [];
    const result = toCryptoTrail(raw, 1);
    expect(result.totalHops).toBe(0);
    expect(result.receivingHotWallet).toBe('');
    expect(result.nodes).toHaveLength(1);
});
