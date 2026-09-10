import { expect, it } from 'vitest';
import { multiHopDemo } from './demos.js';
it('runs the real tracer over an illustrative two-hop fixture', async () => {
  const result = await multiHopDemo();
  expect(result.demo).toBe(true);
  expect(result.nodes.map(node => node.depth)).toEqual([0, 1, 2]);
  expect(result.edges).toHaveLength(2);
  expect(result.candidates[0]).toMatchObject({ hops: 2, valueShare: 0.9, confidence: 86, valueWei: '1800000000000000000' });
});
