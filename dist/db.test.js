import { afterAll, beforeEach, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const folder = mkdtempSync(join(tmpdir(), 'vasp-test-'));
vi.doMock('./config.js', () => ({ config: { databasePath: join(folder, 'store.json') } }));
const { getCachedTrace, putCachedTrace, replaceVasps, seedVasps } = await import('./db.js');
const address = '0x0000000000000000000000000000000000000001';
const result = { sourceAddress: address, nodes: [], edges: [], candidates: [], hiddenTransactions: 0, explanation: '', cached: false };
beforeEach(() => { vi.useRealTimers(); replaceVasps([]); });
afterAll(() => { vi.useRealTimers(); rmSync(folder, { recursive: true, force: true }); });
it('expires a cached trace after fifteen minutes', () => {
    vi.useFakeTimers();
    putCachedTrace(address, result);
    expect(getCachedTrace(address)?.sourceAddress).toBe(address);
    vi.advanceTimersByTime(15 * 60 * 1000);
    expect(getCachedTrace(address)).toBeUndefined();
});
it('invalidates traces when labels change', () => {
    putCachedTrace(address, result);
    seedVasps([{ address, name: 'Test', source: 'test' }]);
    expect(getCachedTrace(address)).toBeUndefined();
    putCachedTrace(address, result);
    replaceVasps([]);
    expect(getCachedTrace(address)).toBeUndefined();
});
