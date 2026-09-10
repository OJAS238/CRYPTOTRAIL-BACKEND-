import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deterministicExplanation, traceWallet } from './tracer.js';
import { getOutgoingTransactions } from './etherscan.js';
import { findVasp } from './db.js';
vi.mock('./etherscan.js', () => ({ getOutgoingTransactions: vi.fn() }));
vi.mock('./db.js', () => ({ findVasp: vi.fn() }));
const source = '0x0000000000000000000000000000000000000001';
const wallet = '0x0000000000000000000000000000000000000002';
const exchange = '0x0000000000000000000000000000000000000003';
const other = '0x0000000000000000000000000000000000000004';
const unit = 10n ** 18n;
const tx = (from, to, value, timestamp) => ({ from, to, valueWei: value * unit, timestamp, hash: `${from}-${to}-${timestamp}` });
beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(findVasp).mockImplementation(address => [exchange, other].includes(address) ? { address, name: 'Exchange', matchType: 'exact' } : undefined);
});
describe('trace accounting', () => {
    it('does not imply attribution when no candidate was matched', () => {
        expect(deterministicExplanation(source, [])).toContain('No known VASP');
    });
    it('bounds downstream attribution by the incoming amount across branches', async () => {
        vi.mocked(getOutgoingTransactions).mockImplementation(async (address) => address === source ? [tx(source, wallet, 1n, 10)] : [tx(wallet, exchange, 100n, 20), tx(wallet, other, 100n, 21)]);
        const result = await traceWallet(source);
        expect(result.candidates).toHaveLength(2);
        expect(result.candidates.reduce((sum, candidate) => sum + BigInt(candidate.valueWei), 0n)).toBe(unit);
        expect(result.candidates.map(candidate => candidate.valueShare)).toEqual([0.5, 0.5]);
        expect(result.candidates[0].scoreBreakdown.valueScore).toBe(20);
    });
    it('excludes transfers preceding or simultaneous with the incoming transfer', async () => {
        vi.mocked(getOutgoingTransactions).mockImplementation(async (address) => address === source ? [tx(source, wallet, 1n, 10)] : [tx(wallet, exchange, 1n, 9), tx(wallet, other, 1n, 10)]);
        expect((await traceWallet(source)).candidates).toEqual([]);
    });
    it('keeps direct transfer amounts intact', async () => {
        vi.mocked(getOutgoingTransactions).mockResolvedValue([tx(source, exchange, 2n, 10)]);
        const result = await traceWallet(source);
        expect(result.candidates[0]).toMatchObject({ valueWei: (2n * unit).toString(), valueShare: 1, confidence: 100 });
    });
});
