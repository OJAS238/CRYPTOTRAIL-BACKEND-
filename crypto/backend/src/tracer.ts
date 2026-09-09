import { config } from './config.js';
import { findVasp } from './db.js';
import { getOutgoingTransactions } from './etherscan.js';
import type { Candidate, TraceEdge, TraceNode, TraceResult, Transaction, VaspMatch } from './types.js';

const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;
const score = (hops: number, valueShare: number, matchType: 'exact' | 'heuristic') => {
  const hopScore = Math.max(0, 40 - (hops - 1) * 10);
  const valueScore = Math.round(valueShare * 40);
  const matchScore = matchType === 'exact' ? 20 : 8;
  const confidence = Math.min(100, hopScore + valueScore + matchScore);
  return { confidence, hopScore, valueScore, matchScore };
};
const confidenceLabel = (value: number): Candidate['label'] => value >= 75 ? 'High' : value >= 50 ? 'Medium' : 'Low';

function selectedTransactions(transactions: Transaction[]): { selected: Transaction[]; hidden: number } {
  const qualifying = transactions.filter((tx) => tx.valueWei >= config.minValueWei).sort((a, b) => a.valueWei > b.valueWei ? -1 : 1);
  return { selected: qualifying.slice(0, config.maxTransactionsPerWallet), hidden: Math.max(0, transactions.length - Math.min(qualifying.length, config.maxTransactionsPerWallet)) };
}

export async function traceWallet(sourceAddress: string): Promise<TraceResult> {
  const nodes = new Map<string, TraceNode>();
  const edges: TraceEdge[] = [];
  const queue: Array<{ address: string; depth: number; sourceValueWei: bigint }> = [{ address: sourceAddress, depth: 0, sourceValueWei: 0n }];
  const visited = new Set<string>([sourceAddress.toLowerCase()]);
  const matches: Array<{ match: VaspMatch; hops: number; valueWei: bigint }> = [];
  let hiddenTransactions = 0;
  nodes.set(sourceAddress.toLowerCase(), { id: sourceAddress.toLowerCase(), address: sourceAddress, kind: 'source', label: 'Investigated wallet', depth: 0 });

  while (queue.length) {
    const current = queue.shift()!;
    if (current.depth >= config.maxDepth) continue;
    const { selected, hidden } = selectedTransactions(await getOutgoingTransactions(current.address));
    hiddenTransactions += hidden;
    for (const tx of selected) {
      const destination = tx.to.toLowerCase();
      const depth = current.depth + 1;
      const vasp = findVasp(destination);
      if (!nodes.has(destination)) {
        nodes.set(destination, { id: destination, address: tx.to, kind: vasp ? 'vasp' : 'wallet', label: vasp ? vasp.name : shortAddress(tx.to), depth, vaspName: vasp?.name });
      }
      edges.push({ id: tx.hash, source: current.address.toLowerCase(), target: destination, hash: tx.hash, valueWei: tx.valueWei.toString() });
      if (vasp) {
        matches.push({ match: vasp, hops: depth, valueWei: tx.valueWei });
      } else if (!visited.has(destination) && depth < config.maxDepth) {
        visited.add(destination);
        queue.push({ address: tx.to, depth, sourceValueWei: tx.valueWei });
      }
    }
  }

  const totalSourceValue = edges.filter((edge) => edge.source === sourceAddress.toLowerCase()).reduce((sum, edge) => sum + BigInt(edge.valueWei), 0n);
  const groups = new Map<string, { match: VaspMatch; hops: number; valueWei: bigint }>();
  for (const item of matches) {
    const key = item.match.address.toLowerCase();
    const old = groups.get(key);
    groups.set(key, old ? { ...old, valueWei: old.valueWei + item.valueWei, hops: Math.min(old.hops, item.hops) } : item);
  }
  const candidates = [...groups.values()].map(({ match, hops, valueWei }) => {
    const valueShare = totalSourceValue ? Number((valueWei * 10_000n) / totalSourceValue) / 10_000 : 0;
    const breakdown = score(hops, valueShare, match.matchType);
    return { name: match.name, address: match.address, hops, valueWei: valueWei.toString(), valueShare, matchType: match.matchType, confidence: breakdown.confidence, label: confidenceLabel(breakdown.confidence), scoreBreakdown: { hopScore: breakdown.hopScore, valueScore: breakdown.valueScore, matchScore: breakdown.matchScore } };
  }).sort((a, b) => b.confidence - a.confidence);
  return { sourceAddress, nodes: [...nodes.values()], edges, candidates, hiddenTransactions, explanation: deterministicExplanation(sourceAddress, candidates), cached: false };
}

export function deterministicExplanation(source: string, candidates: Candidate[]): string {
  if (!candidates.length) return `No known VASP was identified within the configured four-hop trace for ${shortAddress(source)}. This means no matching address was found in the current local dataset; it is not evidence that the funds did not reach a VASP.`;
  const top = candidates[0];
  return `${shortAddress(source)} traced to a known ${top.name} address in ${top.hops} hop${top.hops === 1 ? '' : 's'}. The matched path represents ${(top.valueShare * 100).toFixed(1)}% of the source wallet's traced outgoing value, yielding ${top.label.toLowerCase()} confidence (${top.confidence}/100). This is an investigative lead, not legal proof.`;
}

