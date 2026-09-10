import { afterEach, expect, it, vi } from 'vitest';
import { getOutgoingTransactions } from './etherscan.js';
vi.mock('./config.js', () => ({ config: { etherscanApiKey: 'test-key' } }));
afterEach(() => vi.unstubAllGlobals());
it('explains blocked network access without exposing credentials', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(Object.assign(new Error('fetch failed'), { cause: { code: 'EACCES' } })));
    await expect(getOutgoingTransactions('0x1')).rejects.toThrow('Allow Node.js network access');
});
it('explains a timeout', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(Object.assign(new Error(), { name: 'TimeoutError' })));
    await expect(getOutgoingTransactions('0x1')).rejects.toThrow('Etherscan timed out');
});
it('returns an empty result for a wallet with no transactions', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: '0', message: 'No transactions found', result: [] }) }));
    await expect(getOutgoingTransactions('0x1')).resolves.toEqual([]);
});
