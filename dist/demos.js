import { traceWallet } from './tracer.js';
export const demoSource = '0x000000000000000000000000000000000000d001';
const middle = '0x000000000000000000000000000000000000d002';
const destination = '0x000000000000000000000000000000000000d003';
export async function multiHopDemo() {
    const transactions = [
        { hash: 'illustrative-transfer-1', from: demoSource, to: middle, valueWei: 2n * 10n ** 18n, timestamp: 100 },
        { hash: 'illustrative-transfer-2', from: middle, to: destination, valueWei: 18n * 10n ** 17n, timestamp: 200 }
    ];
    const result = await traceWallet(demoSource, {
        getOutgoingTransactions: async (address) => transactions.filter(tx => tx.from === address.toLowerCase()),
        findVasp: address => address === destination ? { address, name: 'Demo Exchange', matchType: 'exact' } : undefined
    });
    result.demo = true;
    result.nodes.forEach(node => { if (node.id === middle)
        node.label = 'Intermediate wallet'; });
    return result;
}
