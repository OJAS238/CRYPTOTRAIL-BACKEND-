import { putCachedTrace } from './db.js';
import { deterministicExplanation } from './tracer.js';
function cacheDemo(sourceAddress, vaspAddress, name, valueWei, hash) {
    const candidate = { name, address: vaspAddress, confidence: 100, label: 'High', valueShare: 1, valueWei, hops: 1, matchType: 'exact', scoreBreakdown: { hopScore: 40, valueScore: 40, matchScore: 20 } };
    const result = {
        sourceAddress,
        nodes: [
            { id: sourceAddress, address: sourceAddress, kind: 'source', label: 'Investigated wallet', depth: 0 },
            { id: vaspAddress, address: vaspAddress, kind: 'vasp', label: name, vaspName: name, depth: 1 }
        ],
        edges: [{ id: hash, source: sourceAddress, target: vaspAddress, hash, valueWei: candidate.valueWei }],
        candidates: [candidate], hiddenTransactions: 0, explanation: deterministicExplanation(sourceAddress, [candidate]), cached: true
    };
    putCachedTrace(sourceAddress, result);
}
cacheDemo('0xb5d85cbf7cb3ee0d56b3bb207d5fc4b82f43f511', '0x02466e547bfdab679fc49e96bbfc62b9747d997c', 'Coinbase', '125000000000000000', '0xa7cba88bd0fe706f6f7d60968cf7d1796dd8c96ec294fdf290a8a03cecc0815b');
cacheDemo('0x4523462420065fd01e883f713a22df0876747fd5', '0x000483c56fe99127fbd62da5d8b899a159116dc1', 'Bitget', '1588425680015323214', '0x73f4dc6c25f67d60589f5f32194d9bfb159a2ceed5c2ad609307676941bd3c8c');
console.log('Cached verified Coinbase and Bitget demo traces.');
