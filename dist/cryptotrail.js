import { randomUUID } from 'node:crypto';
/** CryptoTrail presents nodes as a linear pipeline; select a real connected path. */
export function toCryptoTrail(result, elapsedMs) {
    const top = result.candidates[0];
    const source = result.sourceAddress.toLowerCase();
    const queue = [{ id: source, path: [] }];
    const visited = new Set([source]);
    let path = [];
    let found = false;
    while (queue.length && top) {
        const current = queue.shift();
        if (current.id === top.address.toLowerCase()) {
            path = current.path;
            found = true;
            break;
        }
        for (const edge of result.edges.filter(edge => edge.source.toLowerCase() === current.id)) {
            const destination = edge.target.toLowerCase();
            if (!visited.has(destination)) {
                visited.add(destination);
                queue.push({ id: destination, path: [...current.path, edge] });
            }
        }
    }
    const ids = [source, ...path.map(edge => edge.target.toLowerCase())];
    const timestamp = new Date().toISOString();
    const sourceValue = result.edges.filter(edge => edge.source.toLowerCase() === source).reduce((sum, edge) => sum + BigInt(edge.valueWei), 0n);
    const warnings = [
        'Confidence is a heuristic score, not certainty or a probability.',
        'USD valuation, mixer assessment, contract verification, gas, block numbers and transfer timestamps are unavailable and returned as null.',
        'Nodes show one connected path to the top-ranked candidate. rawTrace retains the full graph and all candidate evidence.',
        'The matched address is not independently classified as a deposit or hot wallet.'
    ];
    if (result.demo)
        warnings.push('Illustrative demo data; not verified on-chain.');
    if (top && !found)
        warnings.push('No connected path to the candidate was found in the supplied graph.');
    return {
        id: randomUUID(), queryAddress: result.sourceAddress, chain: 'Ethereum', status: 'completed', timestamp,
        totalHops: path.length, avgLatencyMs: Math.round(elapsedMs), confidenceScore: top?.confidence ?? 0,
        attributionExchange: top?.name ?? 'No known VASP found', receivingHotWallet: top?.address ?? '',
        flaggedMixers: null, volumeTracedEth: Number(sourceValue) / 1e18, volumeTracedUsd: null,
        explanation: result.explanation, summary: result.summary, cached: result.cached, demo: !!result.demo,
        nodes: ids.map((id, index) => {
            const node = result.nodes.find(node => node.id.toLowerCase() === id);
            return {
                id, hopIndex: index, entityName: node?.label ?? id, entityType: index === 0 ? 'genesis' : 'eoa',
                address: node?.address ?? id, label: node?.label ?? id,
                txHash: index ? path[index - 1].hash : '', timestamp: null,
                amountEth: Number(index ? BigInt(path[index - 1].valueWei) : sourceValue) / 1e18,
                amountUsd: null, gasUsedGwei: null, riskLevel: null, riskFactors: [], blockNumber: null,
                vaspMatch: node?.kind === 'vasp',
                details: { contractVerified: null, clusterTags: [], heuristicMethod: 'Bounded outgoing-transfer tracing', flowPct: index === ids.length - 1 && top ? top.valueShare * 100 : null }
            };
        }),
        logs: [{ time: timestamp, message: `Trace completed in ${Math.round(elapsedMs)} ms; ${result.edges.length} transfers in the full graph.`, status: 'DONE' }],
        warnings, rawTrace: result
    };
}
